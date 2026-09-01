import 'dart:convert';
import 'package:dio/dio.dart';
import '../storage/local_storage.dart';
import 'api_endpoints.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic errors;

  ApiException(this.message, {this.statusCode, this.errors});

  @override
  String toString() => message;
}

class ApiClient {
  late final Dio dio;

  ApiClient() {
    dio = Dio(
      BaseOptions(
        baseUrl: ApiEndpoints.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await LocalStorage.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          // If 401 unauthorized, try to refresh token
          if (error.response?.statusCode == 401 && error.requestOptions.path != ApiEndpoints.login) {
            final refreshToken = await LocalStorage.getRefreshToken();
            if (refreshToken != null) {
              try {
                final refreshDio = Dio(BaseOptions(baseUrl: ApiEndpoints.baseUrl));
                final res = await refreshDio.post(
                  ApiEndpoints.refreshToken,
                  data: {'refreshToken': refreshToken},
                );

                if (res.statusCode == 200 && res.data['success'] == true) {
                  final newAccessToken = res.data['data']['accessToken'];
                  await LocalStorage.saveTokens(
                    accessToken: newAccessToken,
                    refreshToken: refreshToken,
                  );

                  // Retry original request
                  final retryOptions = error.requestOptions;
                  retryOptions.headers['Authorization'] = 'Bearer $newAccessToken';
                  final clonedResponse = await dio.fetch(retryOptions);
                  return handler.resolve(clonedResponse);
                }
              } catch (_) {
                await LocalStorage.clearSession();
              }
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  // Generic Request Helper
  Future<dynamic> request({
    required String path,
    required String method,
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await dio.request(
        path,
        data: data,
        queryParameters: queryParameters,
        options: (options ?? Options()).copyWith(method: method),
      );
      return response.data;
    } on DioException catch (e) {
      _handleDioError(e);
    } catch (e) {
      throw ApiException(e.toString());
    }
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? queryParameters, Options? options}) {
    return request(path: path, method: 'GET', queryParameters: queryParameters, options: options);
  }

  Future<dynamic> post(String path, {dynamic data, Map<String, dynamic>? queryParameters}) {
    return request(path: path, method: 'POST', data: data, queryParameters: queryParameters);
  }

  Future<dynamic> patch(String path, {dynamic data, Map<String, dynamic>? queryParameters}) {
    return request(path: path, method: 'PATCH', data: data, queryParameters: queryParameters);
  }

  Future<dynamic> delete(String path, {dynamic data, Map<String, dynamic>? queryParameters}) {
    return request(path: path, method: 'DELETE', data: data, queryParameters: queryParameters);
  }

  // Binary Download Helper (for Excel files)
  Future<List<int>> downloadBytes(String path, {Map<String, dynamic>? queryParameters}) async {
    try {
      final token = await LocalStorage.getAccessToken();
      final response = await dio.get<List<int>>(
        path,
        queryParameters: queryParameters,
        options: Options(
          responseType: ResponseType.bytes,
          headers: {
            if (token != null) 'Authorization': 'Bearer $token',
          },
        ),
      );
      return response.data ?? [];
    } on DioException catch (e) {
      _handleDioError(e);
      return [];
    }
  }

  void _handleDioError(DioException e) {
    if (e.response != null) {
      final data = e.response?.data;
      String message = 'An unexpected server error occurred';

      if (data is Map<String, dynamic>) {
        message = data['message'] ?? message;
        throw ApiException(message, statusCode: e.response?.statusCode, errors: data['errors']);
      } else if (data is String) {
        try {
          final decoded = jsonDecode(data);
          message = decoded['message'] ?? data;
        } catch (_) {
          message = data;
        }
      }
      throw ApiException(message, statusCode: e.response?.statusCode);
    } else {
      if (e.type == DioExceptionType.connectionTimeout || e.type == DioExceptionType.receiveTimeout) {
        throw ApiException('Connection timed out. Please check your internet or server connection.');
      } else if (e.type == DioExceptionType.connectionError) {
        throw ApiException('Cannot reach the server. Make sure the backend is running at ${ApiEndpoints.baseUrl}');
      }
      throw ApiException(e.message ?? 'Network connection error');
    }
  }
}

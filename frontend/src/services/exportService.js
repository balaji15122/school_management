import api, { downloadBytes } from './api';
import { downloadFile } from '../utils/fileDownloader';

export const exportService = {
  getExportHistory: async () => {
    const res = await api.get('/export/history');
    return res.data;
  },

  exportSingleSchool: async (schoolId, schoolName = 'School', params = {}) => {
    const data = await downloadBytes(`/export/school/${schoolId}/xlsx`, params);
    const cleanName = schoolName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `${cleanName}_Students_${dateStr}.xlsx`;
    downloadFile(data, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return true;
  },

  exportSchoolPackage: async (schoolId, schoolName = 'School', params = {}) => {
    const data = await downloadBytes(`/export/school/${schoolId}/package`, params);
    const cleanName = schoolName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `${cleanName}_Data_Package_${dateStr}.zip`;
    downloadFile(data, fileName, 'application/zip');
    return true;
  },

  exportSchoolPhotos: async (schoolId, schoolName = 'School', params = {}) => {
    const data = await downloadBytes(`/export/school/${schoolId}/photos`, params);
    const cleanName = schoolName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `${cleanName}_Photos_${dateStr}.zip`;
    downloadFile(data, fileName, 'application/zip');
    return true;
  },

  exportAllSchools: async () => {
    const data = await downloadBytes('/export/all/xlsx');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `All_Schools_Master_Workbook_${dateStr}.xlsx`;
    downloadFile(data, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return true;
  },

  exportAllSchoolsPackage: async () => {
    const data = await downloadBytes('/export/all/package');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `All_Schools_Master_Package_${dateStr}.zip`;
    downloadFile(data, fileName, 'application/zip');
    return true;
  },

  exportFiltered: async (params = {}) => {
    const data = await downloadBytes('/export/filtered/xlsx', params);
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Filtered_Students_Export_${dateStr}.xlsx`;
    downloadFile(data, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return true;
  },
};

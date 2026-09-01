import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import StatsCard from '../components/common/StatsCard';
import StatusBadge from '../components/common/StatusBadge';
import Loader from '../components/common/Loader';
import ErrorStateView from '../components/common/ErrorStateView';
import SubmissionsChart from '../components/dashboard/SubmissionsChart';
import StudentDetailModal from '../components/forms/StudentDetailModal';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { formatters } from '../utils/formatters';
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  Download,
  ArrowRight,
  Eye,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.isSuperAdmin;

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected student for inspection modal
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchDashboardStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getDashboardStats();
      if (res?.success && res?.data) {
        setStats(res.data);
      } else {
        throw new Error(res?.message || 'Failed to load dashboard metrics');
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const summary = stats?.summary || {
    totalSchools: 0,
    totalStudents: 0,
    verified: 0,
    pending: 0,
    rejected: 0,
  };

  const dailySubmissions = stats?.dailySubmissions || [];
  const classDistribution = stats?.classDistribution || [];
  const recentSubmissions = stats?.recentSubmissions || [];

  const maxClassCount = Math.max(
    1,
    ...classDistribution.map((c) => (typeof c.count === 'number' ? c.count : 0))
  );

  return (
    <AppLayout
      title={isSuperAdmin ? 'Platform Overview' : 'School Dashboard'}
      actions={
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/admin/export')}
        >
          <Download size={14} />
          <span>Export Center</span>
        </button>
      }
    >
      {isLoading ? (
        <Loader fullPage text="Loading dashboard metrics..." />
      ) : error ? (
        <ErrorStateView message={error} onRetry={fetchDashboardStats} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Welcome Banner */}
          <div
            className="card"
            style={{
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Welcome back, {user?.name || 'Admin'}
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {isSuperAdmin
                  ? 'Managing all registered school tenants & aggregate student admissions'
                  : `${user?.schoolName || 'School Portal'} • Student Admissions & Data Hub`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/admin/students')}
              >
                <span>{isSuperAdmin ? 'View All Students' : 'Upload Students'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* KPI Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`,
              gap: '14px',
            }}
          >
            {isSuperAdmin && (
              <StatsCard
                title="Registered Schools"
                value={summary.totalSchools}
                icon={Building2}
                color="#6366F1"
                onClick={() => navigate('/admin/schools')}
              />
            )}
            <StatsCard
              title="Total Students"
              value={summary.totalStudents}
              icon={Users}
              color="var(--color-accent)"
              onClick={() => navigate('/admin/students')}
            />
            <StatsCard
              title="Verified Admissions"
              value={summary.verified}
              icon={CheckCircle2}
              color="var(--color-success)"
              onClick={() => navigate('/admin/students')}
            />
            <StatsCard
              title="Pending Review"
              value={summary.pending}
              icon={Clock}
              color="var(--color-warning)"
              onClick={() => navigate('/admin/students')}
            />
          </div>

          {/* Charts & Analytics Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {/* 30-Day Submissions Trend Chart */}
            <div className="card" style={{ padding: '18px 20px', flex: '1 1 55%' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    30-Day Submission Trends
                  </h3>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Daily student admissions registered
                  </p>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--color-accent)',
                    backgroundColor: 'var(--color-accent-subtle)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  Daily Submissions
                </span>
              </div>
              <SubmissionsChart dailySubmissions={dailySubmissions} />
            </div>

            {/* Class Distribution */}
            <div className="card" style={{ padding: '18px 20px', flex: '1 1 35%' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Class Distribution
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Student placement across grades
              </p>

              {classDistribution.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No class distribution records yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {classDistribution.map((item, idx) => {
                    const fraction = item.count / maxClassCount;
                    return (
                      <div key={idx}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '12px',
                            fontWeight: 500,
                            marginBottom: '4px',
                          }}
                        >
                          <span style={{ color: 'var(--text-primary)' }}>
                            {item.class || item.studentClass || `Grade ${idx + 1}`}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {item.count} student{item.count === 1 ? '' : 's'}
                          </span>
                        </div>
                        <div
                          style={{
                            height: '6px',
                            width: '100%',
                            backgroundColor: 'var(--bg-canvas)',
                            borderRadius: 'var(--radius-full)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.round(fraction * 100)}%`,
                              backgroundColor: 'var(--color-accent)',
                              borderRadius: 'var(--radius-full)',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Submissions Section */}
          <div className="card" style={{ padding: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Recent Submissions
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Latest student data entries
                </p>
              </div>
              <button
                type="button"
                className="btn btn-text btn-sm"
                onClick={() => navigate('/admin/students')}
              >
                <span>View All Records</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {recentSubmissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '12px' }}>
                No recent submissions found
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentSubmissions.map((student) => (
                  <div
                    key={student.id || student._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-canvas)',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--color-accent-subtle)',
                          color: 'var(--color-accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}
                      >
                        {student.photoUrl ? (
                          <img
                            src={student.photoUrl}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          formatters.getInitials(student.name)
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {student.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {student.schoolName || student.schoolId?.name || 'School'} • Class {student.class || student.studentClass}-{student.section} • Adm: {student.admissionNumber}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <StatusBadge status={student.status} />
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(student)}
                        style={{
                          padding: '6px',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-muted)',
                          display: 'flex',
                        }}
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      <StudentDetailModal
        isOpen={!!selectedStudent}
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onStatusUpdated={fetchDashboardStats}
      />
    </AppLayout>
  );
};

export default Dashboard;

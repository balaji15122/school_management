/**
 * Tenant scoping middleware
 * Injects tenant context and strictly prevents data leakage across schools.
 */
const scopeToSchool = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Authentication required for tenant scoping',
    });
  }

  const { role, schoolId } = req.user;

  if (role === 'super_admin') {
    // Super admin can access all schools, or optionally filter by schoolId param/query
    const targetSchoolId = req.query.schoolId || req.params.schoolId || req.body.schoolId;
    if (targetSchoolId && targetSchoolId !== 'all') {
      req.schoolFilter = { schoolId: targetSchoolId };
    } else {
      req.schoolFilter = {}; // No filter, see all
    }
  } else {
    // School admin or student MUST be scoped to their assigned school
    const userSchoolId = schoolId ? (schoolId._id || schoolId).toString() : null;

    if (!userSchoolId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: User is not associated with any school tenant',
      });
    }

    req.schoolFilter = { schoolId: userSchoolId };

    // In mutation bodies, override any provided schoolId with user's verified schoolId
    if (req.body && typeof req.body === 'object') {
      req.body.schoolId = userSchoolId;
    }
  }

  next();
};

module.exports = scopeToSchool;

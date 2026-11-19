// withOrg(filter, req, field): merges the caller's organization into a query filter so a
// user can only ever read or modify their own org's data. The org comes from the JWT
// (req.user.orgId), never from the request body or URL.
//
// Collections use different field names:
//   events, services -> `org`   (default)
//   clients          -> `orgs`  (an array; pass 'orgs')
module.exports = function withOrg(filter, req, field = 'org') {
  return { ...filter, [field]: req.user.orgId };
};
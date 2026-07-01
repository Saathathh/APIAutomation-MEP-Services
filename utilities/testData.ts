/**
 * Centralized test data configuration.
 */

// Authentication Service
export const AUTH_TEST_DATA = {
  customerId: '230e86b0-864b-465e-8c7e-11e4cfb98003',
  pingMessage: 'hi',
  userUuid: '230e86b0-864b-465e-8c7e-11e4cfb98003',
  userEmail: 'muhammedhashan_saathath@trimble.com',
  userPayload: {
    email: 'muhammedhashan_saathath@trimble.com',
    firstName: 'Mohamed',
    lastName: 'Saathath',
    roles: [
      'xs-admin-license',
      'xs-admin-authentication',
      'xs-admin-user',
      'xs-admin-developer',
      'xs-admin-featureflags',
      'xs-admin-config',
      'xs-admin-appconfiguration',
      'testRole',
    ],
    adminRoles: [],
  },
  productPayload: {
    id: '2',
    clientId: '6de38ef3-f88d-4ff1-88f8-ca509c5d3a3f',
    clientSecret: process.env.CLIENT_SECRET || '',
    redirectUrl: 'http://localhost:420012',
  },
};

// Authorization Service
export const AUTHZ_TEST_DATA = {
  claimUuid: '70b595c3-7755-4635-b72a-60224c375dac',
  roleUuid: '70b595c3-7755-4635-b72a-60224c375dac',
  testRoleName: 'test123',
  testClaim1: {
    type: 'CustomerId',
    value: 'xxx',
    signature:
      'J+w7R/xRs4UWNldrawVp4cCebAe37IEVcDelD2sDKChumcspG4HCSLjLdSoPjojDGCjzsJTYXmmbip8zu7lzzH0ItWNVB7nQInRE50kgbwDIuDFVLvUwBGd0NHrl3uocWkmvrsQgiNDNIpMJF3Nl4ULUsPQ22MIG4tGZDP9V5ISJirts1kH/X0YzSq5omzmb+nIyz5ALlS/VxiG3U8M8Etwn9mu1VhImfbxUapvqicmwI17R71Q7V6ZRMxO2t5XyHcbZ3nHz7SDa2HzlDt/4HzDaQ+KFOzk1L9E7WZPtv8xhboW+w3uapl41V55IAgOhFTWWE1tc66sLdb5+D8Z8eQ==',
  },
  testClaim2: {
    type: 'CustomerId',
    value: 'dummy_value',
    signature:
      'O0oqmYoijKaF1jrxxQOi8pzulVvMHXAp0/X2Xa7d6hWSMlfDF8Nsv4utOBBbbU3NAJF4zUXlOshEb4V14493k5foUf3d6X+Rr+U5vxvAO8FIYI4vPtWnizTuZmpkdNsfZuIvoInAx930eLtl5+nF/i3ujCgdGhabbLR8HEYbFCuGFI9BgS0Iu4c/c6G/ZGBQzdkQJrIAW/2qDWwL8yC3Dj6jG3YkpH8c72El81+km2seo33ezF7OAb+0EC7WyclTew2N8xTrAJyUFajI+PqDARX+qTcwTI5hnmFLwCB7CNUnYodPiFvr4UCHNnHPSWSipzrFM1q1ekAclH/SmQ6/SA==',
  },
};

// License Service
export const LICENSE_TEST_DATA = {
  customerIdV1: '0cde2a2d-d33a-4b22-9e93-4e760c2b31db',
  skuV1: 'CORE-SERVICES',
  accountId: '1749490746699322',
  feature: 'FEA-MEP-CORE',
  licenseType: 1,
  userId: '70b595c3-7755-4635-b72a-60224c375dac',
  entitlementId: '3faa35cd-6e1f-48b0-8403-bea3959c2ff9',
  customerEmail: 'muhammedhashan_saathath@trimble.com',
};

// Feature Flag Service
export const FEATURE_FLAG_TEST_DATA = {
  knownFlagName: 'FeatureTest1',
  testCategory: 'QA',
};

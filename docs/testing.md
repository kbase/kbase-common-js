# Testing

The unit tests are located in the /test directory. An older "/tests" directory exists for direct browser based testing without a test framework.

## State

The unit tests are currently being developed and are not automated, requiring hand-building the test environment.

## Test Setup

The tests require configuration and runtime services to be started.

The configuration exists in a file test/test-data.js which is loaded as a module hardcoded as "testConfig" and available in the test specs under this module name. There is no initial configuration file -- the file "test-data.sample.js" may be used to jump start the config file. Various are indicated with placeholders, both because they are sensitive security-wise (username and password) and also because the are volatile in nature (workspace and object ids).

Runtime services are also required.

kbase-cdn-js is used to supply dependencies in order to test directly from the build or dist tree. This facilitates fast iterative testing, but it would also be possible to create a build source tree which includes the kbase-common-js project as well as dependencies.

To use kbase-cdn-js, clone it and then build it and start the local test server as per docs. It operates at localhost:10001

The generic mock service runs at :8090 and provides a service endoint for testing failure modes. At present it just simulates server side errors (404, 500, etc.) but could be extended to simulate service calls as well.

kbase deployment - the jsonRpc modules can be run against live kbase deployments. The configuration defaults to CI, but that can be change. The purpose of using the kbase deployment is to exercise jsonRpc, communication, kbase service data structures, and authentication

authentication - the session module is used to generate a token for use in authenticated calls. I know this is a bit circular, and tokens could be generated otherwise and inserted into the configuration file as well.


## Running

After the test runtime support is set up:

```
cd test
karma start test.conf.js
```

Test specs are located in test/specs/active

To simplify developing and managing tests, tests may be moved into test/specs/disabled in order to focus on one or a small set of tests. Any disabled tests should be moved back into the active directory prior to checking in work.
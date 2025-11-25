import { GenericPathActionRouter } from '../../../src/router/GenericPathActionRouter';
import { PathActionRoute } from '../../../src/router/PathActionRoute';

interface ApiRequest {
  path: string;
}

enum HttpAction {
  GET = 'GET',
  POST = 'POST',
  DELETE = 'DELETE',
}

class SocketRoutes {
  static routes: PathActionRoute<string, ApiRequest, string, HttpAction>[] = [
    PathActionRoute.pathAllAction(
      '/api/service/{serviceId}/region/{region}/socket/user',
      (_runtime, _req, match) => `userSocket:${match.variables.serviceId}`
    ),
    PathActionRoute.pathAllAction(
      '/api/service/{serviceId}/region/{region}/socket/group',
      (_runtime, _req, match) => `groupSocket:${match.variables.region}`
    ),
  ];
}

class ProfileRoutes {
  static routes: PathActionRoute<string, ApiRequest, string, HttpAction>[] = [
    PathActionRoute.pathInAction(
      '/api/service/{serviceId}/region/{region}/profile/update',
      [HttpAction.POST],
      (_runtime, _req, match) => `profileUpdate:${match.variables.region}`
    ),
    PathActionRoute.pathNotInAction(
      '/api/service/{serviceId}/region/{region}/profile/locked',
      [HttpAction.DELETE],
      () => 'profileLocked'
    ),
  ];
}

const aggregatedRoutes: PathActionRoute<string, ApiRequest, string, HttpAction>[] = [
  ...SocketRoutes.routes,
  ...ProfileRoutes.routes,
];

describe('Static route list aggregation for GenericPathActionRouter', () => {
  test('dispatches using pre-defined route lists and action filters', async () => {
    const router = new GenericPathActionRouter<string, ApiRequest, string, HttpAction>(
        (req) => req.path
    );
    router.registerAllRoutes(aggregatedRoutes);

    const userSocketReq: ApiRequest = { path: '/api/service/app123/region/test/socket/user' };
    await expect(router.dispatch('rt', userSocketReq, HttpAction.GET)).resolves.toBe('userSocket:app123');

    const groupSocketReq: ApiRequest = { path: '/api/service/app789/region/prod/socket/group' };
    await expect(router.dispatch('rt', groupSocketReq, HttpAction.POST)).resolves.toBe('groupSocket:prod');

    const profileUpdateReq: ApiRequest = { path: '/api/service/app42/region/dev/profile/update' };
    await expect(router.dispatch('rt', profileUpdateReq, HttpAction.POST)).resolves.toBe('profileUpdate:dev');

    const lockedProfileReq: ApiRequest = { path: '/api/service/app42/region/dev/profile/locked' };
    await expect(router.dispatch('rt', lockedProfileReq, HttpAction.GET)).resolves.toBe('profileLocked');

    // Action not allowed cases
    await expect(router.dispatch('rt', lockedProfileReq, HttpAction.DELETE)).resolves.toBeNull();
    await expect(router.dispatch('rt', profileUpdateReq, HttpAction.GET)).resolves.toBeNull();
  });
});

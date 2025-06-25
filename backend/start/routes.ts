/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

// API routes
router.group(() => {
  // Metrics routes
  router.get('/metrics', '#controllers/metrics_controller.index')
  
  // Snapshot policy routes
  router.get('/snapshot-policy/:uuid', '#controllers/snapshot_policy_controller.show')
  router.put('/snapshot-policy/:uuid', '#controllers/snapshot_policy_controller.update')
  
  // User and cluster association routes
  router.get('/user/:userId', '#controllers/user_cluster_controller.getUser')
  router.get('/cluster/:uuid', '#controllers/user_cluster_controller.getCluster')
  router.get('/user/:userId/cluster', '#controllers/user_cluster_controller.getUserCluster')
  router.get('/users-clusters', '#controllers/user_cluster_controller.getAllUsersWithClusters')
}).prefix('/api')

is# Create root directory
mkdir edgefleet-ai
cd edgefleet-ai

# Create all directories at once
mkdir -p .github/workflows
mkdir -p docs/{architecture,api,deployment,presentation}
mkdir -p data/{raw/{vehicle-telemetry,dashcam-footage,traffic-data},processed/{training,validation},simulation/{routes,fleet-data},models}

mkdir -p simulator/{config,core,sensors,data_generators,streaming,scripts,tests}

mkdir -p ml-models/{notebooks,config,data_processing,models/{driver_behavior,route_optimization,object_detection,anomaly_detection,emissions},evaluation,deployment,utils,scripts,tests}

mkdir -p edge-service/{config,core,models,streaming,alerts,scripts,tests}

mkdir -p backend/src/{config,models,controllers,services,routes,middleware,websocket,streaming,jobs,utils,types}
mkdir -p backend/{prisma/migrations,scripts,tests/{unit,integration}}

mkdir -p frontend/src/{components/{common,layout,map,fleet,driver,analytics,routes,alerts,video},pages,hooks,services,store,utils,types,styles}
mkdir -p frontend/{public/assets,tests/{unit,e2e}}

mkdir -p mobile-app/src/{screens,components,navigation,services,utils}
mkdir -p mobile-app/{android,ios}

mkdir -p infrastructure/{docker,kubernetes/{deployments,services,configmaps,secrets},terraform/{modules/{vpc,eks,rds},environments/{dev,prod}},scripts}

mkdir -p monitoring/{prometheus,grafana/dashboards,elk-stack/{logstash,elasticsearch}}

mkdir -p scripts/{setup,data,deployment,demo}

mkdir -p tests/{integration,e2e,performance}

# Create essential root files
touch README.md
touch .gitignore
touch .env.example
touch docker-compose.yml
touch package.json

# Create config files for each module
touch simulator/requirements.txt
touch ml-models/requirements.txt
touch backend/package.json
touch backend/tsconfig.json
touch frontend/package.json
touch frontend/tsconfig.json
touch frontend/tailwind.config.js
touch frontend/vite.config.ts

echo "✅ Project structure created successfully!"
```

---

## 📂 **VISUAL TREE STRUCTURE**
```
edgefleet-ai/
│
├── 📄 README.md                          # Main project documentation
├── 📄 .gitignore                         # Git ignore file
├── 📄 .env.example                       # Environment variables template
├── 📄 docker-compose.yml                 # Docker orchestration
├── 📄 package.json                       # Root package.json (monorepo)
│
├── 📁 .github/
│   └── workflows/
│       ├── ci-cd.yml                     # GitHub Actions CI/CD
│       ├── deploy-frontend.yml
│       └── deploy-backend.yml
│
├── 📁 docs/                              # Documentation
│   ├── architecture/
│   │   ├── system-design.md
│   │   ├── data-flow.md
│   │   └── diagrams.md
│   ├── api/
│   │   ├── rest-api.md
│   │   └── websocket-api.md
│   ├── deployment/
│   │   ├── docker-setup.md
│   │   └── kubernetes-setup.md
│   └── presentation/
│       ├── pitch-deck.pdf
│       └── demo-script.md
│
├── 📁 data/                              # Data storage
│   ├── raw/
│   │   ├── vehicle-telemetry/
│   │   ├── dashcam-footage/
│   │   └── traffic-data/
│   ├── processed/
│   │   ├── training/
│   │   └── validation/
│   ├── simulation/
│   │   ├── routes/
│   │   └── fleet-data/
│   └── models/
│       ├── driver-behavior.pkl
│       ├── object-detection.onnx
│       └── route-optimization.pkl
│
├── 📁 simulator/                         # 🚗 Vehicle Data Simulator
│   ├── requirements.txt
│   ├── config/
│   │   ├── simulation-config.yaml
│   │   └── vehicle-profiles.json
│   ├── core/
│   │   ├── __init__.py
│   │   ├── vehicle_simulator.py         # Main vehicle simulator
│   │   └── fleet_simulator.py           # Fleet management
│   ├── sensors/
│   │   ├── __init__.py
│   │   ├── gps_sensor.py
│   │   ├── obd_sensor.py
│   │   └── camera_sensor.py
│   ├── data_generators/
│   │   ├── __init__.py
│   │   ├── telemetry_generator.py
│   │   └── event_generator.py
│   ├── streaming/
│   │   ├── __init__.py
│   │   ├── kafka_producer.py
│   │   └── websocket_streamer.py
│   ├── scripts/
│   │   ├── generate_fleet_data.py
│   │   ├── simulate_realtime.py
│   │   └── test_simulator.py
│   └── tests/
│       └── test_simulator.py
│
├── 📁 ml-models/                         # 🧠 AI/ML Models
│   ├── requirements.txt
│   ├── notebooks/
│   │   ├── 01-data-exploration.ipynb
│   │   ├── 02-driver-behavior.ipynb
│   │   ├── 03-object-detection.ipynb
│   │   └── 04-route-optimization.ipynb
│   ├── config/
│   │   ├── model-config.yaml
│   │   └── training-config.yaml
│   ├── data_processing/
│   │   ├── __init__.py
│   │   ├── preprocessor.py
│   │   └── feature_engineering.py
│   ├── models/
│   │   ├── driver_behavior/
│   │   │   ├── lstm_model.py
│   │   │   ├── train.py
│   │   │   └── evaluate.py
│   │   ├── route_optimization/
│   │   │   ├── nsga2_optimizer.py
│   │   │   ├── train.py
│   │   │   └── evaluate.py
│   │   ├── object_detection/
│   │   │   ├── yolo_detector.py
│   │   │   ├── train.py
│   │   │   └── inference.py
│   │   ├── anomaly_detection/
│   │   │   ├── autoencoder.py
│   │   │   ├── train.py
│   │   │   └── evaluate.py
│   │   └── emissions/
│   │       ├── fuel_predictor.py
│   │       └── train.py
│   ├── evaluation/
│   │   ├── __init__.py
│   │   └── metrics.py
│   ├── deployment/
│   │   ├── __init__.py
│   │   ├── model_converter.py           # Convert to ONNX
│   │   └── edge_deployer.py
│   ├── utils/
│   │   ├── __init__.py
│   │   └── logger.py
│   ├── scripts/
│   │   ├── train_all_models.py
│   │   ├── evaluate_models.py
│   │   └── convert_to_edge.py
│   └── tests/
│       └── test_models.py
│
├── 📁 edge-service/                      # ⚡ Edge Computing Service
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── config/
│   │   └── edge-config.yaml
│   ├── core/
│   │   ├── __init__.py
│   │   ├── edge_node.py
│   │   └── local_inference.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── model_loader.py
│   ├── streaming/
│   │   ├── __init__.py
│   │   └── cloud_sync.py
│   ├── alerts/
│   │   ├── __init__.py
│   │   └── alert_manager.py
│   ├── scripts/
│   │   └── start_edge_node.py
│   └── tests/
│       └── test_edge_service.py
│
├── 📁 backend/                           # 🌐 Backend API
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── .env.example
│   ├── src/
│   │   ├── index.ts                     # Main entry point
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── kafka.ts
│   │   │   └── redis.ts
│   │   ├── models/
│   │   │   ├── Vehicle.ts
│   │   │   ├── Driver.ts
│   │   │   ├── Trip.ts
│   │   │   └── Alert.ts
│   │   ├── controllers/
│   │   │   ├── vehicleController.ts
│   │   │   ├── driverController.ts
│   │   │   ├── routeController.ts
│   │   │   └── analyticsController.ts
│   │   ├── services/
│   │   │   ├── vehicleService.ts
│   │   │   ├── telemetryService.ts
│   │   │   ├── alertService.ts
│   │   │   └── routeService.ts
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   ├── vehicleRoutes.ts
│   │   │   ├── driverRoutes.ts
│   │   │   └── analyticsRoutes.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   └── errorHandler.ts
│   │   ├── websocket/
│   │   │   ├── socketServer.ts
│   │   │   └── handlers.ts
│   │   ├── streaming/
│   │   │   ├── kafkaConsumer.ts
│   │   │   └── dataAggregator.ts
│   │   ├── jobs/
│   │   │   └── dataCleanup.ts
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   └── validators.ts
│   │   └── types/
│   │       ├── vehicle.types.ts
│   │       └── api.types.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── scripts/
│   │   └── seed.ts
│   └── tests/
│       ├── unit/
│       └── integration/
│
├── 📁 frontend/                          # 💻 React Dashboard
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── Dockerfile
│   ├── index.html
│   ├── public/
│   │   ├── favicon.ico
│   │   └── assets/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   └── Modal.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── DashboardLayout.tsx
│   │   │   ├── map/
│   │   │   │   ├── FleetMap.tsx
│   │   │   │   ├── VehicleMarker.tsx
│   │   │   │   └── RoutePolyline.tsx
│   │   │   ├── fleet/
│   │   │   │   ├── FleetOverview.tsx
│   │   │   │   ├── VehicleList.tsx
│   │   │   │   └── VehicleDetails.tsx
│   │   │   ├── driver/
│   │   │   │   ├── DriverList.tsx
│   │   │   │   └── DriverProfile.tsx
│   │   │   ├── analytics/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── EmissionsChart.tsx
│   │   │   │   └── SafetyMetrics.tsx
│   │   │   ├── routes/
│   │   │   │   ├── RouteOptimizer.tsx
│   │   │   │   └── RouteComparison.tsx
│   │   │   ├── alerts/
│   │   │   │   ├── AlertFeed.tsx
│   │   │   │   └── AlertCard.tsx
│   │   │   └── video/
│   │   │       └── DashcamViewer.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── FleetManagement.tsx
│   │   │   ├── DriverManagement.tsx
│   │   │   ├── RouteOptimization.tsx
│   │   │   └── Analytics.tsx
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useVehicleData.ts
│   │   │   └── useRealTimeUpdates.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── websocket.ts
│   │   │   └── vehicleService.ts
│   │   ├── store/
│   │   │   ├── vehicleStore.ts
│   │   │   ├── driverStore.ts
│   │   │   └── alertStore.ts
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   └── constants.ts
│   │   ├── types/
│   │   │   └── vehicle.types.ts
│   │   └── styles/
│   │       └── globals.css
│   └── tests/
│       ├── unit/
│       └── e2e/
│
├── 📁 mobile-app/                        # 📱 Mobile App (Optional)
│   ├── package.json
│   ├── App.tsx
│   ├── app.json
│   ├── src/
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── VehicleScreen.tsx
│   │   │   └── TripScreen.tsx
│   │   ├── components/
│   │   ├── navigation/
│   │   ├── services/
│   │   └── utils/
│   ├── android/
│   └── ios/
│
├── 📁 infrastructure/                    # 🐳 DevOps & Infrastructure
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.dev.yml
│   │   ├── docker-compose.prod.yml
│   │   ├── Dockerfile.backend
│   │   ├── Dockerfile.frontend
│   │   └── Dockerfile.simulator
│   ├── kubernetes/
│   │   ├── namespace.yaml
│   │   ├── deployments/
│   │   │   ├── backend-deployment.yaml
│   │   │   └── frontend-deployment.yaml
│   │   ├── services/
│   │   │   ├── backend-service.yaml
│   │   │   └── frontend-service.yaml
│   │   ├── configmaps/
│   │   └── secrets/
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── modules/
│   │   │   ├── vpc/
│   │   │   ├── eks/
│   │   │   └── rds/
│   │   └── environments/
│   │       ├── dev/
│   │       └── prod/
│   └── scripts/
│       ├── deploy.sh
│       └── rollback.sh
│
├── 📁 monitoring/                        # 📊 Monitoring Stack
│   ├── prometheus/
│   │   ├── prometheus.yml
│   │   └── alerts.yml
│   ├── grafana/
│   │   └── dashboards/
│   │       ├── fleet-overview.json
│   │       └── system-metrics.json
│   └── elk-stack/
│       ├── logstash/
│       └── elasticsearch/
│
├── 📁 scripts/                           # 🔧 Utility Scripts
│   ├── setup/
│   │   ├── install-dependencies.sh
│   │   └── initialize-project.sh
│   ├── data/
│   │   ├── generate-demo-data.py
│   │   └── seed-database.py
│   ├── deployment/
│   │   ├── build-all.sh
│   │   └── deploy-dev.sh
│   └── demo/
│       ├── start-demo.sh
│       └── generate-demo-video.sh
│
└── 📁 tests/                             # 🧪 Integration Tests
    ├── integration/
    │   └── api-tests.ts
    ├── e2e/
    │   └── dashboard-tests.ts
    └── performance/
        └── load-tests.js
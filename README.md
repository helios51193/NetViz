# NetViz

NetViz (Network Graph Visualizer) is a full-stack web application designed to import, visualize, and interact with complex network graphs. Leveraging a Django-based backend for data processing and an Angular-based frontend for dynamic, real-time rendering, NetViz makes it easy to explore relationships, analyze connectivity, and share visual insights.

## Features

- Import network datasets in CSV and JSON formats  
- Interactive graph visualization with zoom, pan, and node highlighting  
- Multiple layout algorithms and customizable styling 
- Session management for saving and loading graph states  

## Local Setup

### Prerequisites
- Python 3.8+  
- Node.js 16+ and npm  
- Angular CLI (`npm install -g @angular/cli`)  
- Docker & Docker Compose (optional)  

### Backend
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```powershell
cd networkvisualizer
npm install
ng serve --open
```

### Docker (optional)
```powershell
docker-compose -f docker-compose.dev.yml up --build
```

## Production Setup

### Using Docker Compose
```powershell
docker-compose -f docker-compose.prod.yml up --build -d
```
This command will:  
- Build backend and frontend images  
- Launch services in detached mode  
- Serve the frontend through Nginx on port 80  


## Usage & Additional Information

Once the application is running:

- Frontend: open http://localhost:4200/  
- Backend API: available at http://localhost:8000/api/  

### Importing Graphs
Select the format you want to use for importing. Format instruction are provided. 
Supported formats:  
- Excel: File should have 2 sheets - nodes and edges 
- JSON: the json should be compatible with cytoscape graph

### Session Management
- Session are automatically saved after importing the graph 
- Load saved sessions from the “Sessions” menu  

### Configuration Files
- `networkvisualizer/src/app/app.config.ts`: frontend settings  
- `backend/networkvisualizer/settings.py`: Django settings  

### Troubleshooting
- Backend errors: inspect `backend/logs/` directory  
- Frontend build issues: delete `node_modules` and rerun `npm install`  

### Architecture Diagram
- See `screens.drawio` for a visual overview of the system architecture.  

### License
This project is licensed under the MIT License. See LICENSE file.
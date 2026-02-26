# 🚀 AWS 3-Tier Web Architecture Guide

This guide outlines the step-by-step deployment of a secure, scalable 3-tier application using **React (Frontend)**, **Node.js (Backend)**, **and PostgreSQL (RDS)**.

## 🏗️ Architecture Overview
- Public Tier: Internet Gateway -> Public ALB -> Frontend EC2 (Nginx + Docker).
- Private Tier: NAT Gateway -> Internal ALB -> Backend EC2 (Node.js Docker).
- Data Tier: Amazon RDS (PostgreSQL).

## 🛠️ Step 1: Network Foundation (VPC)
1. Create VPC: CIDR 172.31.0.0/16.
### Create Subnets:
- Public Subnet (for Public ALB & Bastion).
- Private Subnets (Frontend, Backend, and Database).
### Gateways:
- Attach an Internet Gateway (IGW) to the VPC for public access.
- Create a NAT Gateway in the Public Subnet (requires an Elastic IP) so private instances can download updates.
### Route Tables:
- Public RT: 0.0.0.0/0 -> IGW.
- Private RT: 0.0.0.0/0 -> NAT Gateway.

### 🔐 Step 2: Security Groups (The "Chain of Trust")

Configure Security Groups using **IDs** (not IPs) to ensure a closed loop. 
*Note: Inbound rules allow traffic in; Outbound rules allow the instance to "reach out" to the next tier.*

#### **Inbound Rules**

| Security Group | Port | Source (SG ID) | Purpose |
| :--- | :--- | :--- | :--- |
| **sg-bastion** | 22 | `Your-Public-IP/32` | SSH access from your laptop |
| **sg-public-alb** | 80 | `0.0.0.0/0` | Public internet traffic |
| **sg-frontend** | 80 | `sg-public-alb` | Traffic from Public ALB to Nginx |
| **sg-frontend** | 22 | `sg-bastion` | SSH from Bastion to Frontend |
| **sg-internal-alb** | 3000 | `sg-frontend` | Frontend Nginx to Internal ALB |
| **sg-backend** | 5000 | `sg-internal-alb` | Internal ALB to Node.js App |
| **sg-backend** | 22 | `sg-bastion` | SSH from Bastion to Backend |
| **sg-database** | 5432 | `sg-backend` | Backend App to RDS Postgres |

#### **Outbound Rules (Required for Connectivity)**

| Security Group | Port | Destination | Purpose |
| :--- | :--- | :--- | :--- |
| **sg-frontend** | 3000 | `sg-internal-alb` | Allow Nginx to reach Internal ALB |
| **sg-frontend** | 80/443 | `0.0.0.0/0` | Reach NAT Gateway for Docker pulls |
| **sg-backend** | 5432 | `sg-database` | Allow App to reach RDS |
| **sg-backend** | 80/443 | `0.0.0.0/0` | Reach NAT Gateway for updates |
| **sg-bastion** | 22 | `VPC-CIDR` | Allow SSH jumps to private instances |


## Step 3: Data Tier (PostgreSQL)

1. Created a DB Subnet Group using the Private Subnets.
2. Launched Amazon RDS (Postgres).
3. Initialization: Connected via the Bastion host to create the todos table:
    `CREATE TABLE todos (id SERIAL PRIMARY KEY, task TEXT NOT NULL);`
  
## Step 4: Backend Tier (Node.js)

1. Docker: Built for linux/amd64 and pushed to Docker Hub.
2. Deployment: Run on the Backend EC2 in Private Subnet 2.
3. Internal ALB: Configured to listen on Port 3000 and forward to the Backend on Port 5000.
4. Health Check Path: /todos.


## Step 5: Frontend Tier & Nginx Bridge

Because the React app runs in the user's browser, it cannot communicate with the Internal ALB directly. Nginx acts as the bridge.
1. React Code: Updated API_URL to a relative path: const API_URL = "/api/todos";.
2. Nginx Installation: sudo apt install nginx -y.
3. Nginx Configuration: Located at /etc/nginx/sites-available/default

``` server {
    listen 80;

    # 1. ROUTE TO FRONTEND (React App)
    # Serves the static React UI running in Docker on Port 3000
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 2. ROUTE TO BACKEND (Internal ALB Bridge)
    # Intercepts browser calls to "/api/..." and forwards them to the Internal ALB.
    # The trailing slash after :3000/ is MANDATORY to strip the "/api" prefix.
    location /api/ {
        proxy_pass http://[YOUR_INTERNAL_ALB_DNS_NAME]:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # Timeouts to prevent 504 Gateway errors
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }
} ```


In a 3-tier architecture, Nginx is used as a Reverse Proxy. It acts as a "Middleman" between the public internet and your private network.

# Why use Nginx here?

The "Private DNS" Bridge: Your React code runs in the user's browser (outside AWS). The browser cannot see your Internal ALB (it has no public IP). Nginx sits on the Frontend server (which is inside AWS) and can "see" the Internal ALB. It take the browser's request and "jumps" it across to the backend.

Clean URLs: Instead of having a messy URL like http://internal-alb-12345.aws.com, your code just calls /api/todos. Nginx handles the routing.

Security: It hides your internal AWS infrastructure. The browser only ever talks to the Public ALB; it never knows the Backend or Database even exist.

``` sudo apt update
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/default ```
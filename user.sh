#!/bin/bash
# 1. Update and Install Docker & Nginx
apt-get update -y
apt-get install -y ca-certificates curl gnupg nginx

# 2. Setup Docker GPG Key and Repo
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# 3. Install Docker Engine
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io

# 4. Start Services and Set Permissions
systemctl enable docker
systemctl start docker
systemctl enable nginx
systemctl start nginx
usermod -aG docker ubuntu

# 5. Configure Nginx Reverse Proxy (The "Bridge")
# Replace [INTERNAL_ALB_DNS] with your actual Internal ALB DNS name
cat <<EOF > /etc/nginx/sites-available/default
server {
    listen 80;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /api/ {
        proxy_pass http://[INTERNAL_ALB_DNS]:3000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
    }
}
EOF

# Test Nginx and Restart
nginx -t && systemctl restart nginx

# 6. Docker Login and Run App
# Replace placeholders with your actual Docker Hub details
echo "YOUR_DOCKER_PASSWORD_OR_TOKEN" | docker login -u "YOUR_DOCKER_USERNAME" --password-stdin
docker pull YOUR_DOCKER_USERNAME/YOUR_IMAGE_NAME:latest
docker run -d --name frontend-app -p 3000:3000 YOUR_DOCKER_USERNAME/YOUR_IMAGE_NAME:latest
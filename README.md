# thesis-backend

### Steps to run this project locally:

1. Install Node (if necesary): https://nodejs.org/en/download

2. Clone the repository to your machine:

```bash
git clone git@github.com:nagyb3/thesis-backend.git
```

3. Navigate to the cloned repository:

```bash
cd thesis-backend
```

4. Install the dependencies using NPM:

```bash
npm install
```

5. Create a file named .env in the root directory of this project to manage environment variables, and add the following content:

```bash
PORT=5500
POSTGRES_HOST="localhost"
POSTGRES_PORT=5432
POSTGRES_USER="test"
POSTGRES_PASSWORD="test"
POSTGRES_DB="test"

JWT_SECRET="verysecret"

NODE_ENV="localhost"

AWS_BUCKET_NAME=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

Note: the values for `AWS_BUCKET_NAME`, `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are omitted on purpose from this README. You should ask the author of this project for these credentials, or set up your own AWS S3 buckets to use.

6. Install Docker (if necessary):

https://www.docker.com/

7. Start a PostgreSQL database using the Docker CLI:

```bash
docker run --name thesis-backend-postgres \
-e POSTGRES_USER=test \
-e POSTGRES_PASSWORD=test \
-p 5432:5432 \
-d postgres
```

Alternatively, you can also start the PostgreSQL database container using the Docker Desktop app and set the appropiate `POSTGRES_USER` and `POSTGRES_PASSWORD` environment variables.

8. Run the project:

```bash
npm run dev
```

FROM maven:3.9.8-amazoncorretto-21-al2023 AS build
COPY . /app
WORKDIR /app

ENV DATASOURCE_URL=jdbc:postgresql://localhost:5432/test?sslmode=disable
ENV DATASOURCE_USER=postgres
ENV DATASOURCE_PASS=postgres

RUN mvn -Dtests.skip=true package 

FROM amazoncorretto:22-jdk

COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar /app.jar

EXPOSE 8080

# The '-Djava.security.egd=file:/dev/./urandom' is optional and is used to speed up the random number generation.
ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-jar","/app.jar"]

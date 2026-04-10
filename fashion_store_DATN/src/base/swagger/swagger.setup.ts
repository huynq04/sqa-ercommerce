import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { config } from '@config/config.service';

export function initSwagger(app: INestApplication) {
  if (config.isProduction()) return;

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle(config.PROJECT_NAME)
      .setDescription('REST API documentation for Fashion Store backend system')
      .setVersion(config.VERSION)
      .setContact(
        'Fashion Store Team',
        'https://fashionstore.la',
        'support@fashionstore.la',
      )
      .setExternalDoc('Backend Overview', config.HOST + '/overview')
      .addServer(config.HOST, 'Local server')
      .addServer('https://fashionstore.la', 'Production server')
      .addBearerAuth()
      .build(),
      {
          deepScanRoutes: true,
      },
  );

  const httpAdapter = app.getHttpAdapter();
  const CREDENTIAL = config.SWAGGER_CREDENTIALS;

  httpAdapter.use(
    '/apidoc',
    (req: Request, res: Response, next: NextFunction) => {
      const auth = req.headers.authorization || '';
      const [name, pass] = Buffer.from(auth.split(' ').pop() || '', 'base64')
        .toString('ascii')
        .split(':');

      if (name !== CREDENTIAL.name || pass !== CREDENTIAL.pass) {
        res.status(401).setHeader('WWW-Authenticate', 'Basic');
        return res.end('Unauthorized');
      }
      next();
    },
  );

  SwaggerModule.setup('/apidoc', app, document, {
    customSiteTitle: config.PROJECT_NAME + ' API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
    },
  });
}

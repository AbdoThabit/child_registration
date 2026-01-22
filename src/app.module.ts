import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcceptLanguageResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import path from 'path';
import { UserAgentLangResolver } from 'src/common/resolvers/UserAgentLangResolver';
import { icareDbConfig, isecureDbConfig } from 'src/config/database.config';
// import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from 'src/common/json-respons-files/transform.interceptor';
import { HttpExceptionFilter } from 'src/common/json-respons-files/http-exception.filter';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { AppLoggerModule } from './common/logger/logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClassModule } from './modules/class/class.module';
import { MssqlClientModule } from './config/mssql/mssql-client.module';


@Module({
  imports: [
        
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot(icareDbConfig),
        TypeOrmModule.forRoot(isecureDbConfig),
        // ThrottlerModule.forRoot([{
        //       ttl: 60000,
        //       limit: 20,
        //     }]),
        I18nModule.forRoot({
        fallbackLanguage: 'en',
        loaderOptions: {
            path: path.join(__dirname, '/i18n/'),
            watch: true,
            includeSubfolders: true,
        },
        resolvers: [
                { use: QueryResolver, options: ['lang'] }, // ?lang=ar
                UserAgentLangResolver,
                new HeaderResolver(['x-custom-lang']),    // custom header
                AcceptLanguageResolver,                   // standard Accept-Language header
            ],
        }),
        MssqlClientModule,
        AuthModule,
        AppLoggerModule,
        ClassModule
    ],
    providers: [
      AppService,
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    // { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  controllers: [AppController],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { HabitacionesModule } from './habitaciones/habitaciones.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { HuespedesModule } from './huespedes/huespedes.module';
import { TiposHabitacionModule } from './tiposhabitacion/tiposhabitacion.module';
import { ReservacionesModule } from './reservaciones/reservaciones.module';
import { RecepcionModule } from './recepcion/recepcion.module';
import { LimpiezaModule } from './limpieza/limpieza.module';
import { ReportesModule } from './reportes/reportes.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        type: 'mysql',
        host: c.get('DB_HOST', 'localhost'),
        port: +c.get('DB_PORT', 3306),
        username: c.get('DB_USERNAME', 'root'),
        password: c.get('DB_PASSWORD', ''),
        database: c.get('DB_NAME', 'hotel_dios_padre'),
        ssl:
          c.get('DB_SSL', 'false') === 'true'
            ? {
                rejectUnauthorized:
                  c.get('DB_SSL_REJECT_UNAUTHORIZED', 'true') !== 'false',
              }
            : undefined,
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    ServeStaticModule.forRoot({ rootPath: join(__dirname, '..', 'public') }),
    AuthModule,
    HabitacionesModule,
    UsuariosModule,
    HuespedesModule,
    TiposHabitacionModule,
    ReservacionesModule,
    RecepcionModule,
    LimpiezaModule,
    ReportesModule,
  ],
})
export class AppModule {}

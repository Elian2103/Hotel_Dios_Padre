import { ReservacionesService } from './reservaciones.service';

describe('ReservacionesService historial visible', () => {
  it('mantiene activas y limita finalizadas o canceladas al día actual', async () => {
    const queryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    const reservaciones = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    } as any;
    const service = new ReservacionesService(
      reservaciones,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await service.list();

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("r.estado IN ('En proceso','Confirmada')"),
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("DATE(r.fecha_fin)=CURDATE()"),
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("CURTIME() < '23:59:00'"),
    );
  });
});

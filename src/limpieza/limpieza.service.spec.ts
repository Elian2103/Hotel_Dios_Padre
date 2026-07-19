import { LimpiezaService } from './limpieza.service';

describe('LimpiezaService historial visible', () => {
  it('conserva pendientes y muestra finalizadas solamente el día actual', async () => {
    const dataSource = { query: jest.fn().mockResolvedValue([]) } as any;
    const service = new LimpiezaService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      dataSource,
    );

    await service.list();

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining("CURTIME() < '23:59:00'"),
    );
  });

  it('limita las observaciones visibles al día actual', async () => {
    const dataSource = { query: jest.fn().mockResolvedValue([]) } as any;
    const service = new LimpiezaService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      dataSource,
    );

    await service.observaciones();

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('DATE(o.created_at) = CURDATE()'),
    );
  });
});

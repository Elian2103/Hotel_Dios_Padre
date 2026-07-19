import { ReportesController } from './reportes.controller';

describe('ReportesController PDF', () => {
  it('genera y entrega un PDF con el logotipo del hotel', async () => {
    const dataSource = {
      query: jest.fn((sql: string) => {
        if (sql.includes('WITH RECURSIVE')) {
          return Promise.resolve([
            { dia: '2026-07-18', habitaciones: 2, ganancias: 1600 },
          ]);
        }
        if (sql.includes('GROUP BY DATE')) {
          return Promise.resolve([
            { fecha: '2026-07-18', reservaciones: 2, huespedes: 4 },
          ]);
        }
        return Promise.resolve([
          { tipo: 'Doble', usos: 2, dias: 4, ganancias: 3200 },
        ]);
      }),
    } as any;
    const controller = new ReportesController(dataSource);
    let archivo: Buffer | undefined;
    const response = {
      set: jest.fn(),
      end: jest.fn((contenido: Buffer) => {
        archivo = contenido;
      }),
    } as any;

    await controller.pdf('2026-07-01', '2026-07-18', response);

    expect(response.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'application/pdf',
        'Content-Disposition': expect.stringContaining('.pdf'),
      }),
    );
    expect(archivo?.subarray(0, 5).toString()).toBe('%PDF-');
    expect(archivo?.length).toBeGreaterThan(2000);
    expect(archivo?.toString('latin1')).toContain('/Subtype /Image');
  });

  it('agrupa la ocupación y las ganancias por tipo de habitación', async () => {
    const dataSource = {
      query: jest
        .fn()
        .mockResolvedValue([
          { tipo: 'Básica', usos: 3, dias: 5, ganancias: 2500 },
        ]),
    } as any;
    const controller = new ReportesController(dataSource);

    const resultado = await controller.tiposHabitacion(
      '2026-07-01',
      '2026-07-18',
    );

    expect(resultado).toEqual([
      { tipo: 'Básica', usos: 3, dias: 5, ganancias: 2500 },
    ]);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('GROUP BY th.id, th.nombre'),
      ['2026-07-01', '2026-07-18'],
    );
    expect(dataSource.query.mock.calls[0][0]).toContain('ganancias');
    expect(dataSource.query.mock.calls[0][0]).toContain(
      'COALESCE(NULLIF(rh.precio, 0), th.precio, 0)',
    );
    expect(dataSource.query.mock.calls[0][0]).toContain(
      'GREATEST(DATEDIFF(r.fecha_fin, r.fecha_inicio), 1)',
    );
  });

  it('convierte una única fila del controlador en una lista', async () => {
    const fila = { tipo: 'Doble', usos: 1, dias: 2, ganancias: 2500 };
    const dataSource = {
      query: jest.fn().mockResolvedValue(fila),
    } as any;
    const controller = new ReportesController(dataSource);

    await expect(
      controller.tiposHabitacion('2026-06-04', '2026-07-18'),
    ).resolves.toEqual([fila]);
  });

  it('ordena los días por los mayores ingresos', async () => {
    const dataSource = {
      query: jest
        .fn()
        .mockResolvedValue([
          { dia: '2026-07-14', habitaciones: 1, ganancias: 850 },
        ]),
    } as any;
    const controller = new ReportesController(dataSource);

    const resultado = await controller.ingresosPorDia(
      '2026-07-01',
      '2026-07-18',
    );

    expect(resultado).toHaveLength(1);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY ganancias DESC, dia ASC'),
      ['2026-07-18', '2026-07-01', '2026-07-01', '2026-07-18'],
    );
  });
});

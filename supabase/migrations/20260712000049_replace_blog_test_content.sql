-- Elimina los artículos de blog de prueba y siembra 10 artículos reales
-- orientados al sector azucarero (fábrica, agrícola, administración).
delete from public.content_items
where type = 'blog'
  and id in (
    '10000000-0000-4000-8000-000000000009',
    '10000000-0000-4000-8000-000000000010',
    '10000000-0000-4000-8000-000000000011',
    '10000000-0000-4000-8000-000000000012'
  );

insert into public.content_items
  (id, type, title, slug, summary, body, category, tags, is_featured, status, published_at)
values
  (
    '20000000-0000-4000-8000-000000000001',
    'blog',
    'Pol, brix y pureza: qué mirar primero cuando el rendimiento de fábrica no cuadra',
    'pol-brix-pureza-que-mirar-primero-rendimiento-fabrica',
    'Cuando el balance de masa no cierra, no siempre es un problema de clarificación. Una guía práctica para priorizar dónde buscar primero.',
    'Cuando el rendimiento de fábrica se desvía de lo esperado, la tentación es revisar primero el tren de evaporación o los tachos de cristalización. En la práctica, buena parte de las desviaciones de pol y pureza se originan más arriba: en la calidad del jugo mezclado y en la eficiencia de la etapa de clarificación.

El primer chequeo debería ser la relación entre brix y pol del jugo diluido contra el jugo clarificado. Una caída de pureza superior a 0.5 puntos entre estas dos etapas suele apuntar a dosificación de cal o floculante fuera de rango, o a tiempos de retención insuficientes en los clarificadores. El segundo punto de control es la temperatura de calentamiento previo a la clarificación: por debajo de 100°C la coagulación de coloides es incompleta y arrastra impurezas que después se traducen en mayor color ICUMSA del azúcar final.

Solo después de descartar estos dos puntos tiene sentido mirar aguas abajo. Un jugo clarificado con buena pureza que se degrada en el tren de evaporadores casi siempre es un problema de incrustación o de tiempo de residencia excesivo a alta temperatura, que genera inversión de sacarosa.

Documentar estos tres indicadores por turno —brix/pol de jugo diluido, pureza de jugo clarificado y temperatura de calentamiento— con visibilidad para todos los turnos reduce el tiempo de diagnóstico de horas a minutos cuando algo se sale de rango.',
    'Producción',
    array['clarificación', 'pol', 'brix', 'pureza', 'zafra'],
    true,
    'published',
    '2026-05-04T12:00:00+00:00'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'blog',
    'TCH y RAC: los dos números que de verdad predicen una buena zafra',
    'tch-rac-numeros-que-predicen-buena-zafra',
    'Toneladas de caña por hectárea y rendimiento en azúcar por caña son las métricas que conectan el campo con la fábrica. Cómo leerlas juntas.',
    'Es común que el área agrícola y la fábrica midan el éxito de la zafra con reglas distintas: el campo celebra TCH altas, mientras que fábrica se enfoca en el RAC. El problema aparece cuando estas dos métricas se optimizan por separado, porque no siempre se mueven en la misma dirección.

Una TCH alta lograda a costa de cortar caña inmadura o con exceso de agua de riego en las semanas previas al corte suele venir acompañada de un RAC más bajo: más volumen de caña, pero con menor concentración de sacarosa recuperable. Por eso el indicador que realmente importa para la rentabilidad de la zafra es el producto de ambos, expresado en toneladas de azúcar por hectárea.

Para acercar estos dos mundos, conviene coordinar el programa de corte con base en maduración (relación brix/pureza en campo mediante refractómetro) y no solo en calendario o disponibilidad de corte. Un lote con TCH moderada pero maduración óptima puede aportar más azúcar recuperable que un lote de mayor tonelaje cortado antes de tiempo.

El seguimiento semanal de TCH y RAC por lote, cruzado con la fecha de corte y el tiempo transcurrido entre corte y molienda, es la base de datos más valiosa que un ingenio puede construir para mejorar zafra tras zafra.',
    'Agrícola',
    array['TCH', 'RAC', 'caña de azúcar', 'madurez', 'zafra'],
    true,
    'published',
    '2026-05-06T12:00:00+00:00'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'blog',
    'Integrar Honeywell Experion, Allen-Bradley y Siemens en un mismo ingenio sin duplicar esfuerzos',
    'integrar-experion-allen-bradley-siemens-mismo-ingenio',
    'Muchos ingenios operan con sistemas de control de distintos fabricantes en diferentes áreas. OPC UA permite unificar la visibilidad sin reemplazar lo que ya funciona.',
    'No es raro encontrar un ingenio donde el área de generación opera con Allen-Bradley, la sala de calderas con Siemens PCS Neo y el proceso de fábrica con Honeywell Experion. Cada sistema fue instalado en un momento distinto, con un proveedor distinto, y reemplazarlos todos por una sola marca rara vez se justifica económicamente.

La alternativa práctica es tratar la integración como un problema de datos, no de control. En lugar de intentar que un sistema controle a otro, cada plataforma expone sus variables relevantes vía OPC UA (o, en equipos más antiguos, OPC DA con un gateway de conversión), y un histórico central en SQL Server o MySQL consolida las señales para reporting, dashboards y análisis de causa raíz.

Los puntos donde más vale la pena invertir primero son los que cruzan áreas: consumo de vapor de calderas contra demanda de evaporadores, generación eléctrica contra consumo de fábrica, y paradas de campo o batey que afectan la molienda. Estos son exactamente los datos que hoy suelen vivir en sistemas separados y que, sin integración, obligan a reconstruir el panorama manualmente después de cada incidente.

Un proyecto de integración bien acotado —enfocado en variables críticas y no en "conectar todo"— típicamente se implementa en semanas, no meses, y da visibilidad inmediata sobre las interdependencias entre áreas que antes solo se descubrían cuando algo fallaba.',
    'Tecnología',
    array['OPC UA', 'Honeywell Experion', 'Allen-Bradley', 'Siemens PCS Neo', 'SCADA'],
    false,
    'published',
    '2026-05-11T12:00:00+00:00'
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    'blog',
    'Cogeneración con bagazo: cómo saber si su ingenio está dejando energía sobre la mesa',
    'cogeneracion-bagazo-energia-sobre-la-mesa',
    'El bagazo es el combustible más barato que tiene un ingenio, pero también el más fácil de desperdiciar. Tres indicadores para evaluar la eficiencia real de la cogeneración.',
    'La cogeneración con bagazo suele evaluarse solo por los megavatios exportados a la red durante zafra, pero ese número por sí solo no dice si el proceso es eficiente. Tres relaciones dan un diagnóstico mucho más completo.

La primera es el consumo específico de vapor por tonelada de caña molida. Valores por encima de 500 kg de vapor por tonelada suelen indicar oportunidades de mejora en el aislamiento térmico de líneas, en la recuperación de condensados o en fugas que rara vez se cuantifican porque no generan una parada visible.

La segunda es la relación entre bagazo generado y bagazo consumido en calderas. Un superávit de bagazo constante no es necesariamente buena noticia: puede significar que la caldera opera con exceso de aire o con baja eficiencia de combustión, desperdiciando poder calorífico que podría convertirse en más vapor y, por tanto, en más energía exportable.

La tercera es la presión y temperatura de vapor sostenidas contra el diseño de la turbina. Operar sistemáticamente por debajo del punto de diseño reduce la eficiencia de conversión a electricidad, aunque el balance de vapor parezca cuadrar.

Medir estas tres relaciones turno a turno, y no solo al cierre de zafra, permite detectar pérdidas progresivas —como incrustación en calderas o desajustes de combustión— mientras todavía son baratas de corregir.',
    'Energía',
    array['cogeneración', 'bagazo', 'calderas', 'eficiencia energética'],
    false,
    'published',
    '2026-05-14T12:00:00+00:00'
  ),
  (
    '20000000-0000-4000-8000-000000000005',
    'blog',
    'Mantenimiento predictivo en turbinas y calderas: qué vigilar antes de que la zafra empiece',
    'mantenimiento-predictivo-turbinas-calderas-antes-zafra',
    'Las paradas no programadas durante zafra cuestan mucho más que una inspección adicional en la preparación. Una lista de verificación basada en condición, no en calendario.',
    'El mantenimiento basado en calendario fijo —revisar cada equipo cada X meses sin importar su condición real— sigue siendo la norma en muchos ingenios, pero deja pasar fallas que se venían anunciando con semanas de anticipación. El mantenimiento predictivo no reemplaza el programa de paradas, lo hace más preciso.

En turbinas, el indicador más temprano de desgaste en cojinetes suele ser vibración, no temperatura: para cuando la temperatura del cojinete sube de forma notable, el desgaste ya está avanzado. Un análisis de vibración mensual durante la época de reparación, y semanal durante zafra en equipos críticos, detecta desalineaciones y desbalanceos antes de que se conviertan en una parada de emergencia.

En calderas, el seguimiento de la eficiencia de combustión (relación de gases de combustión, oxígeno residual) es más confiable que esperar una caída de presión para detectar incrustación en tubos. Una tendencia de eficiencia a la baja durante varias semanas, aunque la caldera siga "funcionando bien", suele anticipar una limpieza necesaria antes de que se vuelva una parada forzada en plena molienda.

El costo de una inspección adicional durante la preparación de zafra es una fracción del costo de una parada no programada durante la molienda, tanto en producción perdida como en el efecto de arrastre sobre el corte de caña programado en campo.',
    'Mantenimiento',
    array['mantenimiento predictivo', 'turbinas', 'calderas', 'vibración', 'zafra'],
    false,
    'published',
    '2026-05-19T12:00:00+00:00'
  ),
  (
    '20000000-0000-4000-8000-000000000006',
    'blog',
    'Cachaza y melaza no son residuos: la economía circular que ya está pagando la factura',
    'cachaza-melaza-economia-circular-ingenio',
    'Lo que antes se trataba como subproducto de descarte hoy es una línea de ingreso y de reducción de costos agrícolas. Cómo aprovechar mejor ambos flujos.',
    'Durante décadas, la cachaza se manejó como un problema logístico —qué hacer con el volumen que sale de los filtros— más que como un insumo con valor. La realidad es que la cachaza, compostada correctamente, es un mejorador de suelo con contenido relevante de materia orgánica, fósforo y calcio, exactamente los nutrientes que muchos suelos cañeros de la región necesitan reponer después de varios ciclos de corte.

Devolver la cachaza compostada a los lotes de donde salió el corte —en lugar de acumularla o transportarla a distancias que encarecen el flete— reduce la dependencia de fertilización química de fondo y mejora la retención de humedad en suelos arenosos, un problema recurrente en época seca.

La melaza, por su parte, ya tiene mercado consolidado como insumo para alimentación animal y para producción de alcohol, pero su valor cambia según el momento de venta: los precios de melaza suelen tener estacionalidad ligada al ciclo de zafra regional, no solo local. Vender la totalidad del volumen inmediatamente después de producirla, sin evaluar contratos a plazo o almacenamiento, puede significar dejar margen sobre la mesa en años de alta demanda.

Tratar cachaza y melaza como líneas de producto con su propio plan de gestión —no como subproductos que "hay que sacar de la fábrica"— cambia la conversación de costo de disposición a ingreso adicional y ahorro agrícola.',
    'Sostenibilidad',
    array['cachaza', 'melaza', 'economía circular', 'suelo', 'subproductos'],
    false,
    'published',
    '2026-05-22T12:00:00+00:00'
  ),
  (
    '20000000-0000-4000-8000-000000000007',
    'blog',
    'Lo que todo ingenio debe tener listo antes de que empiece la fiscalización de zafra',
    'lo-que-ingenio-debe-tener-listo-fiscalizacion-zafra',
    'Cuotas de producción, normativa laboral de corte y requisitos ambientales conviven en el marco regulatorio salvadoreño del azúcar. Una revisión de lo que suele quedar para último momento.',
    'El marco regulatorio que rige la actividad azucarera en El Salvador combina normativa de cuotas de producción y comercialización, obligaciones laborales específicas para la temporada de corte, y requisitos ambientales sobre el manejo de vinaza, cachaza y emisiones de calderas. La mayoría de los ingenios cumple con cada uno de estos frentes por separado, pero pocos los revisan de forma integrada antes de iniciar zafra.

En el frente laboral, la contratación de personal de corte trae obligaciones específicas de seguridad social y condiciones de trabajo que conviene auditar antes del arranque, no durante, cuando corregir un contrato o un registro ya implica exposición. En el frente ambiental, los permisos de descarga de aguas residuales y de emisiones de caldera suelen tener vigencias que no coinciden con el calendario de zafra, y renovarlos sobre la fecha límite genera riesgo innecesario.

En el frente comercial, el seguimiento de cuota de producción asignada frente a producción real debería ser un indicador que administración revisa junto con fábrica, no un cálculo que se hace solo al cierre de zafra cuando ya no hay margen de ajuste.

Una checklist compartida entre administración, fábrica y campo —revisada al menos dos meses antes del arranque de molienda— evita que el cumplimiento regulatorio se convierta en una carrera contra el tiempo en las semanas más críticas del año.',
    'Regulación',
    array['regulación', 'El Salvador', 'cuota de producción', 'normativa laboral', 'zafra'],
    false,
    'published',
    '2026-05-27T12:00:00+00:00'
  ),
  (
    '20000000-0000-4000-8000-000000000008',
    'blog',
    'Reducir la variabilidad de ICUMSA sin comprar equipo nuevo: el rol del control automático',
    'reducir-variabilidad-icumsa-control-automatico-cristalizacion',
    'El color del azúcar final depende menos del equipo instalado y más de qué tan bien se controla el proceso de cristalización turno a turno.',
    'Cuando el color ICUMSA del azúcar varía de forma importante entre turnos con el mismo equipo de tachos, el problema casi nunca es la capacidad instalada: es la variabilidad en cómo cada turno opera el mismo proceso. Temperatura de meladura, punto de corte de templa y velocidad de agotamiento son parámetros que, sin control automático, terminan dependiendo del criterio individual del maestro azucarero de turno.

Implementar lazos de control automático sobre estas variables —usando la instrumentación que ya suele existir en la sala de tachos, integrada al SCADA de la planta— no requiere reemplazar los tachos, solo estandarizar el punto de operación y dejar que el sistema lo sostenga con más consistencia de la que permite el ajuste manual continuo.

El resultado más medible no es un color ICUMSA promedio más bajo, sino una desviación estándar más baja entre templas. Para un comprador de azúcar refinada, la consistencia turno a turno suele pesar tanto como el valor absoluto de color, porque reduce el riesgo de rechazo de lotes por variabilidad.

Antes de evaluar una inversión en equipo nuevo para mejorar color, vale la pena medir cuánta de la variabilidad actual se explica simplemente por la falta de control automático sobre parámetros que ya se miden, pero que hoy se ajustan a criterio manual.',
    'Automatización',
    array['ICUMSA', 'cristalización', 'control automático', 'SCADA', 'tachos'],
    false,
    'published',
    '2026-06-01T12:00:00+00:00'
  ),
  (
    '20000000-0000-4000-8000-000000000009',
    'blog',
    'Cómo leer el mercado internacional del azúcar sin perderse en el ruido diario',
    'como-leer-mercado-internacional-azucar-sin-ruido-diario',
    'El contrato de futuros NY11 mueve titulares todos los días, pero no todas las variaciones son relevantes para una decisión de venta. Qué mirar y qué ignorar.',
    'El precio del contrato de futuros de azúcar cruda (NY11) se mueve todos los días por razones que van desde el clima en Brasil hasta decisiones de política energética sobre etanol en India. Seguir cada movimiento diario como si fuera una señal de decisión lleva a reaccionar a ruido, no a tendencia.

Lo que sí conviene monitorear de forma sistemática son tres factores estructurales: el diferencial de producción de los principales exportadores (Brasil, India, Tailandia) frente al consumo global proyectado; la relación de precio entre azúcar y etanol en Brasil, que determina cuánta caña se desvía de un producto al otro; y el nivel de inventarios reportado por los principales importadores, que anticipa presión de compra en los meses siguientes.

Para una decisión de venta o de cobertura, es más útil construir una vista de mediano plazo —tendencia de 60 a 90 días sobre estos tres factores— que reaccionar a la variación intradía del contrato. Esto no elimina la necesidad de vigilar el mercado a diario, pero cambia la pregunta de "¿subió o bajó hoy?" a "¿esto confirma o contradice la tendencia que veníamos observando?".

Contar con un resumen semanal de estos indicadores, en lugar de solo el precio spot, es lo que permite tomar decisiones de comercialización con criterio en lugar de reaccionar al titular del día.',
    'Mercado',
    array['NY11', 'futuros de azúcar', 'mercado internacional', 'comercialización'],
    true,
    'published',
    '2026-06-05T12:00:00+00:00'
  ),
  (
    '20000000-0000-4000-8000-000000000010',
    'blog',
    'De datos dispersos en MySQL y SQL Server a decisiones en tiempo real durante zafra',
    'datos-dispersos-mysql-sql-server-decisiones-tiempo-real-zafra',
    'Muchos ingenios ya tienen los datos que necesitan para decidir mejor, solo que están repartidos entre sistemas que no se hablan entre sí. La digitalización empieza por conectar, no por reemplazar.',
    'Es común que un ingenio tenga datos agrícolas en un sistema, datos de fábrica en otro, y datos administrativos en Microsoft Business Central, cada uno con su propia base —algunos en MySQL, otros en SQL Server— sin una capa que los conecte. El resultado es que las decisiones que requieren cruzar información de varias áreas terminan haciéndose con reportes armados manualmente, días después de que la información dejó de ser accionable.

La digitalización efectiva no siempre significa reemplazar estos sistemas por uno nuevo. En la mayoría de los casos, el mayor retorno viene de construir una capa de integración liviana: vistas o procesos programados que consolidan las tablas relevantes de cada sistema en un modelo de datos común, consultable desde un dashboard compartido entre fábrica, campo y administración.

Los cruces que más valor generan durante zafra suelen ser los que hoy nadie ve juntos en tiempo real: TCH y RAC por lote frente a tiempo transcurrido entre corte y molienda, consumo de vapor frente a producción de azúcar por turno, y costo de corte y transporte frente al rendimiento del lote correspondiente.

Empezar por dos o tres cruces de alto impacto —en lugar de intentar unificar toda la información de golpe— es lo que hace que un proyecto de digitalización entregue valor visible en la misma zafra en que se implementa, en vez de convertirse en un proyecto de infraestructura de varios años sin resultados intermedios.',
    'Innovación',
    array['digitalización', 'SQL Server', 'MySQL', 'Business Central', 'datos'],
    false,
    'published',
    '2026-06-10T12:00:00+00:00'
  );

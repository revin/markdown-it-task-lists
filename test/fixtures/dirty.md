# Boton  Registra nuevo pedido con clave  
### Prerequisitos
 Antes de comenzxar se necesitaran als tablas temporales:
```sql
CREATE TEMP TABLE tmp_pedidos
(
    gpo            CHAR (3),
    gen            CHAR (3),
    esp            CHAR (4),
    dif            CHAR (2),
    var            CHAR (2),
    partida        CHAR (4),
    desc_art       CHAR (254),
    cant           INT,
    precio         money (16, 2),
    preciot        money (16, 2),
    marca          CHAR (25),
    procedencia    CHAR (20),
    unimedida      CHAR (3),
    parida         INT,
    PRIMARY KEY (gpo, gen, esp, dif, var)
);

CREATE TEMP TABLE tmp_pedidos2
(
    no_pedido    CHAR (7),
    rfc          CHAR (15),
    gpo          CHAR (3),
    gen          CHAR (3),
    esp          CHAR (4),
    dif          CHAR (2),
    var          CHAR (2),
    porcen       FLOAT,
    cantidad     INT,
    canaten      INT
)
```

### Funcionalidad
- borra `tmp_pedidos` y `tmp_pedidos2`
- recarga los datos de requisicion para el numero `'0000000000'` (*parametro `1:`*)
```sql
        SELECT a.gpo, a.gen, a.esp, a.dif, a.var,
       a.cve_part_pres, b.cantidad_maxima,
       a.desc_art, b.cantidad_aten_req
  FROM adq_articulos a, adq_requisiciond b
 WHERE a.gpo = b.gpo AND a.gen = b.gen 
    AND a.esp = b.esp AND a.dif = b.dif AND a.var = b.var 
    AND b.no_requisicion = :1
```  

- Checa que tenga registro en `spnumped`
    - procedimiento `adq_spnumped` . trae el valor maximo de `no_pedido` desde la tabla `adq_ordenesp` primero si puede que tenga 7 caracteres si no el maximo cualquiera o nada si no hay registros
    - Si esta vacio lanza error y sale, debe haber registros en `adq_ordenesp`
- `prefijo` ultimo digito del año.
- `pedido` parte numerica del numero de pedido obtenido en `spnumped`
- `prefijo1` parte del año a verificar desde el numero de pedido obtenido en `spnumped` para ver si coincide con el del año en curso.
- si `pedido` llego a `9999` hacerlo `90999`
- si `prefijo1` es menor a `prefijo` (por cambio de año)
    - se hace rollover al pedido, guardandose valor temporal
        - `edno_pedido.text = 'D'+prefijo+'90001'`
    - caso contrario
        - `edno_pedido.text = 'D'+prefijo+pedido`
- contar los reqistros de la orden que correspondan al numero de pedido calculado, para asegurarse que no esta pisando los registros de alguien mas, **el conteo debe ser `cero`** o se vuelve a comenzar para sacar otro numero ```btnuevoclick(nil);```
```sql
    select count(no_pedido) from adq_ordenesp
    where no_pedido="'+edno_pedido.text+'"´
```
- Crea un registro dummy para comenzar la captura. y dejar el numero apartado si alguien mas la estuviera usando
```sql
    INSERT INTO adq_ordenesp (no_pedido,
                          fecha_expedicion,
                          gpo,
                          gen,
                          esp,
                          dif,
                          var,
                          cant_solicit,
                          cant_comprom,
                          cant_atendida,
                          precio,
                          descuento,
                          clas_ptal_entrega,
                          fecha_entrega,
                          status,
                          no_ord_compra)
     VALUES ("'+edno_pedido.text+'",
             "1900-01-01 12:00:00.00",
             "060",
             "953",
             "0597",
             "00",
             "01",
             0,
             0,
             0,
             0,
             0,
             "APARTADO",
             "12/12/1900",
             "0",
             0)
```  
- si falla la creacion de estre registro vuelva a intentar el proceso nuevamente ```btnuevoclick(nil);```
- Terminado este proceso estará listo para la captura en un registro nuevo.






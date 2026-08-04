import { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  obtenerDepartamentosUruguay,
  obtenerLocalidadesArgentina,
  obtenerLocalidadesUruguay,
  obtenerProvinciasArgentina,
  type OpcionGeografica,
} from '@cair/shared';
import { colors, fontSize, fontWeight, radius, spacing } from '@cair/tokens';

type Pais = 'Argentina' | 'Uruguay';

function useProvincias(pais: Pais) {
  const { data, isLoading } = useQuery({
    queryKey: ['geo', 'provincias', pais],
    queryFn: () =>
      pais === 'Argentina'
        ? obtenerProvinciasArgentina()
        : Promise.resolve(obtenerDepartamentosUruguay()),
  });

  return { opciones: data ?? [], cargando: isLoading };
}

function useLocalidades(pais: Pais, provinciaId: string | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: ['geo', 'localidades', pais, provinciaId],
    queryFn: () => {
      if (!provinciaId) return Promise.resolve<OpcionGeografica[]>([]);
      return pais === 'Argentina'
        ? obtenerLocalidadesArgentina(provinciaId)
        : Promise.resolve(obtenerLocalidadesUruguay(provinciaId));
    },
    enabled: provinciaId !== undefined,
  });

  return { opciones: data ?? [], cargando: isLoading };
}

function SelectorModal({
  visible,
  titulo,
  opciones,
  cargando,
  onSeleccionar,
  onCerrar,
}: {
  visible: boolean;
  titulo: string;
  opciones: OpcionGeografica[];
  cargando: boolean;
  onSeleccionar: (opcion: OpcionGeografica) => void;
  onCerrar: () => void;
}) {
  const [busqueda, setBusqueda] = useState('');
  const filtradas = opciones.filter((opcion) =>
    opcion.nombre.toLowerCase().includes(busqueda.toLowerCase()),
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar}>
      <View style={estilos.modal}>
        <View style={estilos.modalEncabezado}>
          <Text style={estilos.modalTitulo}>{titulo}</Text>
          <Pressable onPress={onCerrar}>
            <Text style={estilos.modalCerrar}>Cerrar</Text>
          </Pressable>
        </View>

        <TextInput
          style={estilos.buscador}
          placeholder="Buscar…"
          placeholderTextColor={colors.neutral[400]}
          value={busqueda}
          onChangeText={setBusqueda}
        />

        {cargando ? (
          <ActivityIndicator style={estilos.cargando} color={colors.brand[600]} />
        ) : (
          <FlatList
            data={filtradas}
            keyExtractor={(opcion) => opcion.id}
            renderItem={({ item }) => (
              <Pressable
                style={estilos.opcion}
                onPress={() => {
                  onSeleccionar(item);
                  setBusqueda('');
                }}
              >
                <Text style={estilos.opcionTexto}>{item.nombre}</Text>
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

export function SelectorProvinciaLocalidad({
  pais,
  provincia,
  localidad,
  onCambiarProvincia,
  onCambiarLocalidad,
}: {
  pais: Pais;
  provincia: string;
  localidad: string;
  onCambiarProvincia: (provincia: string, coords?: { lat: number; lng: number }) => void;
  onCambiarLocalidad: (localidad: string, coords?: { lat: number; lng: number }) => void;
}) {
  const [modalAbierto, setModalAbierto] = useState<'provincia' | 'localidad' | null>(null);
  const { opciones: provincias, cargando: cargandoProvincias } = useProvincias(pais);
  const provinciaSeleccionada = provincias.find((opcion) => opcion.nombre === provincia);
  const { opciones: localidades, cargando: cargandoLocalidades } = useLocalidades(
    pais,
    provinciaSeleccionada?.id,
  );

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.campo}>
        <Text style={estilos.etiqueta}>{pais === 'Argentina' ? 'Provincia' : 'Departamento'}</Text>
        <Pressable
          style={estilos.selector}
          onPress={() => {
            setModalAbierto('provincia');
          }}
        >
          <Text style={provincia ? estilos.selectorTexto : estilos.selectorPlaceholder}>
            {provincia || 'Elegir…'}
          </Text>
        </Pressable>
      </View>

      <View style={estilos.campo}>
        <Text style={estilos.etiqueta}>Localidad</Text>
        <Pressable
          style={[estilos.selector, !provincia && estilos.selectorDeshabilitado]}
          disabled={!provincia}
          onPress={() => {
            setModalAbierto('localidad');
          }}
        >
          <Text style={localidad ? estilos.selectorTexto : estilos.selectorPlaceholder}>
            {localidad || (provincia ? 'Elegir…' : 'Elegí primero la provincia')}
          </Text>
        </Pressable>
      </View>

      <SelectorModal
        visible={modalAbierto === 'provincia'}
        titulo={pais === 'Argentina' ? 'Elegir provincia' : 'Elegir departamento'}
        opciones={provincias}
        cargando={cargandoProvincias}
        onSeleccionar={(opcion) => {
          const coords = opcion.lat !== undefined && opcion.lng !== undefined
            ? { lat: opcion.lat, lng: opcion.lng }
            : undefined;
          onCambiarProvincia(opcion.nombre, coords);
          onCambiarLocalidad('');
          setModalAbierto(null);
        }}
        onCerrar={() => {
          setModalAbierto(null);
        }}
      />

      <SelectorModal
        visible={modalAbierto === 'localidad'}
        titulo="Elegir localidad"
        opciones={localidades}
        cargando={cargandoLocalidades}
        onSeleccionar={(opcion) => {
          const coords = opcion.lat !== undefined && opcion.lng !== undefined
            ? { lat: opcion.lat, lng: opcion.lng }
            : undefined;
          onCambiarLocalidad(opcion.nombre, coords);
          setModalAbierto(null);
        }}
        onCerrar={() => {
          setModalAbierto(null);
        }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: spacing[3],
  },
  campo: {
    gap: spacing[1],
  },
  etiqueta: {
    fontSize: fontSize.sm,
    color: colors.neutral[700],
  },
  selector: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.neutral[50],
  },
  selectorDeshabilitado: {
    backgroundColor: colors.neutral[100],
  },
  selectorTexto: {
    fontSize: fontSize.base,
    color: colors.neutral[900],
  },
  selectorPlaceholder: {
    fontSize: fontSize.base,
    color: colors.neutral[400],
  },
  modal: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    paddingTop: spacing[16],
    paddingHorizontal: spacing[6],
  },
  modalEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  modalTitulo: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  modalCerrar: {
    fontSize: fontSize.base,
    color: colors.brand[600],
  },
  buscador: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: fontSize.base,
    marginBottom: spacing[3],
  },
  cargando: {
    marginTop: spacing[6],
  },
  opcion: {
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  opcionTexto: {
    fontSize: fontSize.base,
    color: colors.neutral[900],
  },
});

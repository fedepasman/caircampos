import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { colors, fontSize, fontWeight, radius, spacing } from '@cair/tokens';
import { supabase } from '../lib/supabase';
import { urlFotoCampo } from '../lib/url-foto-campo';
import type { FotoCampo } from '../lib/queries/panel';

// Siempre se reconvierte a JPEG antes de subir, sin importar el formato de
// origen: en iPhone la galería suele guardar en HEIC, que el backend no
// acepta (mismo allowlist que la web: JPEG/PNG/WebP).
const CONTENT_TYPE = 'image/jpeg';
const TAMANO_MAXIMO_BYTES = 8 * 1024 * 1024;

export function SubidaFotos({ campoId, fotos }: { campoId: string; fotos: FotoCampo[] }) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const ordenadas = [...fotos].sort((a, b) => a.orden - b.orden);

  async function agregarFoto() {
    setError(null);

    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      setError('Necesitamos permiso para acceder a tus fotos.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (resultado.canceled || resultado.assets.length === 0) return;

    const activo = resultado.assets[0];
    if (!activo) return;

    setSubiendo(true);
    try {
      const imagenRenderizada = await ImageManipulator.manipulate(activo.uri).renderAsync();
      const convertida = await imagenRenderizada.saveAsync({
        compress: 0.7,
        format: SaveFormat.JPEG,
      });

      const blob = await (await fetch(convertida.uri)).blob();
      if (blob.size > TAMANO_MAXIMO_BYTES) {
        setError('La foto pesa más de 8MB.');
        return;
      }

      const nombreArchivo = activo.fileName
        ? activo.fileName.replace(/\.\w+$/, '.jpg')
        : `foto-${String(Date.now())}.jpg`;

      const resultadoInvoke = await supabase.functions.invoke<{
        uploadUrl: string;
        objectKey: string;
      }>('subir-foto-campo', {
        body: {
          campo_id: campoId,
          nombre_archivo: nombreArchivo,
          content_type: CONTENT_TYPE,
          tamano_bytes: blob.size,
        },
      });
      const errorFirma = resultadoInvoke.error as unknown;
      const firma = resultadoInvoke.data;
      if (errorFirma || !firma) throw new Error('No se pudo firmar la subida');
      const subida = await fetch(firma.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': CONTENT_TYPE },
        body: blob,
      });
      if (!subida.ok) throw new Error('No se pudo subir la foto');

      const siguienteOrden =
        ordenadas.length > 0 ? Math.max(...ordenadas.map((foto) => foto.orden)) + 1 : 0;
      const { error: errorInsert } = await supabase
        .from('campo_fotos')
        .insert({ campo_id: campoId, object_key: firma.objectKey, orden: siguienteOrden });
      if (errorInsert) throw errorInsert;

      await queryClient.invalidateQueries({ queryKey: ['campos', 'editar', campoId] });
    } catch {
      setError('No se pudo subir la foto. Intentá de nuevo.');
    } finally {
      setSubiendo(false);
    }
  }

  function confirmarBorrado(fotoId: string) {
    Alert.alert('Borrar foto', '¿Seguro que querés borrar esta foto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: () => {
          void borrarFoto(fotoId);
        },
      },
    ]);
  }

  async function borrarFoto(fotoId: string) {
    const { error: errorDelete } = await supabase.from('campo_fotos').delete().eq('id', fotoId);
    if (errorDelete) {
      setError('No se pudo borrar la foto.');
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['campos', 'editar', campoId] });
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.etiqueta}>Fotos</Text>
      <FlatList
        horizontal
        data={ordenadas}
        keyExtractor={(foto) => foto.id}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={estilos.fotoContenedor}>
            <Image source={{ uri: urlFotoCampo(item.object_key) }} style={estilos.foto} />
            <Pressable
              style={estilos.borrar}
              onPress={() => {
                confirmarBorrado(item.id);
              }}
            >
              <Text style={estilos.borrarTexto}>✕</Text>
            </Pressable>
          </View>
        )}
        ListFooterComponent={
          <Pressable
            style={estilos.agregar}
            disabled={subiendo}
            onPress={() => {
              void agregarFoto();
            }}
          >
            {subiendo ? (
              <ActivityIndicator color={colors.brand[600]} />
            ) : (
              <Text style={estilos.agregarTexto}>+ Agregar</Text>
            )}
          </Pressable>
        }
      />
      {error && <Text style={estilos.error}>{error}</Text>}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: spacing[2],
  },
  etiqueta: {
    fontSize: fontSize.sm,
    color: colors.neutral[800],
  },
  fotoContenedor: {
    marginRight: spacing[2],
  },
  foto: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[100],
  },
  borrar: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borrarTexto: {
    color: colors.neutral[50],
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  agregar: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agregarTexto: {
    fontSize: fontSize.sm,
    color: colors.brand[600],
  },
  error: {
    fontSize: fontSize.sm,
    color: colors.danger,
  },
});

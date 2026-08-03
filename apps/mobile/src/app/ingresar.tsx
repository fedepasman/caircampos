import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { esquemaIngreso, type Ingreso } from '@cair/schemas';
import { colors, fontSize, fontWeight, radius, spacing } from '@cair/tokens';
import { CampoTexto } from '../components/CampoTexto';
import { supabase } from '../lib/supabase';

export default function Ingresar() {
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Ingreso>({ resolver: zodResolver(esquemaIngreso) });

  async function alEnviar(datos: Ingreso) {
    setErrorGeneral(null);
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword(datos);
    setEnviando(false);

    if (error) {
      setErrorGeneral('Email o contraseña incorrectos.');
      return;
    }

    router.replace('/panel');
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Ingresar</Text>

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <CampoTexto
            etiqueta="Email"
            keyboardType="email-address"
            value={field.value}
            onChangeText={field.onChange}
            error={errors.email?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <CampoTexto
            etiqueta="Contraseña"
            secureTextEntry
            value={field.value}
            onChangeText={field.onChange}
            error={errors.password?.message}
          />
        )}
      />

      {errorGeneral && <Text style={estilos.errorGeneral}>{errorGeneral}</Text>}

      <Pressable
        style={estilos.boton}
        disabled={enviando}
        onPress={() => {
          void handleSubmit(alEnviar)();
        }}
      >
        <Text style={estilos.textoBoton}>{enviando ? 'Ingresando…' : 'Ingresar'}</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[6],
    backgroundColor: colors.neutral[50],
  },
  titulo: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  errorGeneral: {
    fontSize: fontSize.sm,
    color: colors.danger,
  },
  boton: {
    backgroundColor: colors.brand[600],
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  textoBoton: {
    color: colors.neutral[50],
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});

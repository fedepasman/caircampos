import { View } from 'react-native';
import { colors } from '@cair/tokens';
import { FormularioCampo } from '../../../components/FormularioCampo';
import { useSesion } from '../../../lib/use-sesion';
import { useSocio } from '../../../lib/queries/panel';

export default function CampoNuevo() {
  const { sesion } = useSesion();
  const { data: socio } = useSocio(sesion?.user.id);

  if (!socio) return <View style={{ flex: 1, backgroundColor: colors.neutral[50] }} />;

  return <FormularioCampo socioId={socio.id} />;
}

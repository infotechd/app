import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  GestureResponderEvent, // Tipo para o evento de onPress
  StyleProp, // Tipo para estilos opcionais
  ViewStyle,  // Tipo para estilos do TouchableOpacity
  TextStyle   // Tipo para estilos do Text
} from 'react-native';

// 1. Definir a interface para as Props do componente
interface CustomButtonProps {
  /** O texto a ser exibido no botão. */
  title: string;
  /** A função a ser chamada quando o botão for pressionado. */
  onPress: (event: GestureResponderEvent) => void; // Tipo preciso do React Native
  /** Estilos personalizados opcionais para o container do botão (TouchableOpacity). */
  buttonStyle?: StyleProp<ViewStyle>;
  /** Estilos personalizados opcionais para o texto do botão. */
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Um componente de botão customizado e reutilizável.
 */
// 2. Tipar o componente funcional usando React.FC e a interface de Props
const CustomButton: React.FC<CustomButtonProps> = ({
                                                     title,
                                                     onPress,
                                                     buttonStyle, // Incluir props opcionais
                                                     textStyle    // Incluir props opcionais
                                                   }) => (
  // Usa os estilos locais e mescla com os estilos passados via props (se houver)
  <TouchableOpacity style={[styles.button, buttonStyle]} onPress={onPress}>
    <Text style={[styles.text, textStyle]}>{title}</Text>
  </TouchableOpacity>
);

// 3. Estilos permanecem os mesmos
const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2980b9', // Cor azul padrão
    paddingVertical: 12,      // Aumentar padding vertical
    paddingHorizontal: 20,    // Aumentar padding horizontal
    borderRadius: 8,          // Bordas mais arredondadas
    alignItems: 'center',     // Centralizar texto se ele quebrar linha
    justifyContent: 'center', // Centralizar texto verticalmente
    minWidth: 100,            // Largura mínima
    marginVertical: 5,        // Margem vertical padrão
  },
  text: {
    color: '#ffffff', // Cor branca padrão
    fontSize: 16,     // Tamanho de fonte padrão
    fontWeight: '600', // Peso da fonte semi-bold
    textAlign: 'center',
  },
});

export default CustomButton;

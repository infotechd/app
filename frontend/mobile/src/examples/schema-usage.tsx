import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { 
  createUserSchema, 
  loginUserSchema,
  offerSearchSchema,
  type User,
  type CreateUser
} from 'app-common';

/**
 * Example component demonstrating form validation with Zod schemas
 */
const UserRegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<Partial<CreateUser>>({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof CreateUser, value: string) => {
    setFormData((prev: Partial<CreateUser>) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field as string]) {
      setErrors((prev: Record<string, string>) => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  const handleSubmit = () => {
    // Validate form data using Zod schema
    const result = createUserSchema.safeParse(formData);

    if (result.success) {
      // Form data is valid
      Alert.alert('Success', 'Registration successful!');
      // Here you would typically send the data to your API
      console.log('Valid form data:', result.data);
    } else {
      // Form data is invalid, extract and format errors
      const formattedErrors: Record<string, string> = {};

      result.error.issues.forEach(issue => {
        const path = issue.path[0] as string;
        formattedErrors[path] = issue.message;
      });

      setErrors(formattedErrors);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      <View style={styles.inputContainer}>
        <Text>Name</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(value) => handleChange('name', value)}
          placeholder="Enter your name"
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text>Email</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(value) => handleChange('email', value)}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text>Password</Text>
        <TextInput
          style={styles.input}
          value={formData.password}
          onChangeText={(value) => handleChange('password', value)}
          placeholder="Enter your password"
          secureTextEntry
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      <Button title="Register" onPress={handleSubmit} />
    </View>
  );
};

/**
 * Example of validating search parameters
 */
const validateSearchParams = (searchParams: any) => {
  const result = offerSearchSchema.safeParse(searchParams);

  if (result.success) {
    return { valid: true, data: result.data };
  } else {
    return { 
      valid: false, 
      errors: result.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    };
  }
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
  },
  errorText: {
    color: 'red',
    marginTop: 5,
  }
});

export { UserRegistrationForm, validateSearchParams };

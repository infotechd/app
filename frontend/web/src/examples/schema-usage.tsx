import React, { useState, FormEvent } from 'react';
import { 
  createUserSchema, 
  loginUserSchema,
  offerSearchSchema,
  type User,
  type CreateUser,
  type LoginUser
} from 'app-common';

/**
 * Example component demonstrating form validation with Zod schemas
 */
const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<Partial<LoginUser>>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Validate form data using Zod schema
    const result = loginUserSchema.safeParse(formData);

    if (result.success) {
      // Form data is valid
      alert('Login successful!');
      // Here you would typically send the data to your API
      console.log('Valid login data:', result.data);
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
    <div className="login-form">
      <h2>Login</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            className={errors.email ? 'input-error' : ''}
          />
          {errors.email && <div className="error-message">{errors.email}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className={errors.password ? 'input-error' : ''}
          />
          {errors.password && <div className="error-message">{errors.password}</div>}
        </div>
        
        <button type="submit" className="submit-button">Login</button>
      </form>
    </div>
  );
};

/**
 * Example of validating offer search parameters
 */
const useOfferSearch = () => {
  const [searchParams, setSearchParams] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (params: any) => {
    // Validate search parameters using Zod schema
    const result = offerSearchSchema.safeParse(params);
    
    if (!result.success) {
      setError('Invalid search parameters');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Here you would typically fetch data from your API
      // const response = await api.searchOffers(result.data);
      // setSearchResults(response.data);
      
      // Mock response for example
      setSearchResults([
        { id: '1', title: 'Example Offer 1', price: 100 },
        { id: '2', title: 'Example Offer 2', price: 200 }
      ]);
      
      setSearchParams(result.data);
    } catch (err) {
      setError('Failed to fetch search results');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    search,
    searchParams,
    searchResults,
    isLoading,
    error
  };
};

export { LoginForm, useOfferSearch };

// CSS styles for the form (would typically be in a separate CSS file)
const styles = `
.login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.input-error {
  border-color: red !important;
}

.error-message {
  color: red;
  font-size: 12px;
  margin-top: 5px;
}

.submit-button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.submit-button:hover {
  background-color: #45a049;
}
`;
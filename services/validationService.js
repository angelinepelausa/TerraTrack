export const validateSignUp = (formData) => {
  const errors = {};

  // Email validation
  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Invalid email format';
  }

  // Username validation
  if (!formData.username) {
    errors.username = 'Username is required';
  } else if (formData.username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  }

  // Philippine phone validation
  if (!formData.phoneNumber) {
    errors.phoneNumber = 'Phone number is required';
  } else if (!/^(\+63|0)9\d{9}$/.test(formData.phoneNumber)) {
    errors.phoneNumber = 'Invalid Philippine phone number';
  }

  // Password validation (merged requirement message)
  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (
    formData.password.length < 8 ||
    !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/.test(formData.password)
  ) {
    errors.password =
      'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';
  }

  // Confirm password
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const authErrorMessages = {
  'auth/email-already-in-use': 'Email already registered',
  'email-already-in-use': 'Email already registered',
  'username-already-in-use': 'Username is already taken',
  'auth/username-already-in-use': 'Username is already taken',
  'auth/invalid-email': 'Invalid email address',
  'auth/weak-password': 'Password must be stronger',
  'auth/operation-not-allowed': 'Operation not allowed',
  'permission-denied': 'Permission denied. Update your app',
};

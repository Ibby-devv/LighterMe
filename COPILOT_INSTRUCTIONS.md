# React Native Development - Copilot Instructions

## Project Setup

- **Framework**: Expo with React Native CLI
- **Language**: TypeScript (all new files must be `.tsx` or `.ts`)
- **Navigation**: React Navigation v6+ (Stack, Tab, Drawer navigators)
- **State Management**: Context API + custom hooks (no Redux unless explicitly needed)
- **Testing**: Jest + React Native Testing Library

## Component Architecture

### Component Structure
- Use **functional components only** with React hooks
- Keep components under 250 lines of code
- Separate concerns: presentational components vs container components
- Props should be typed with interfaces

### File Organization
```
src/
├── screens/          # Full screen components
├── components/       # Reusable UI components
├── hooks/            # Custom hooks
├── context/          # Context providers
├── services/         # API calls, utilities
├── types/            # TypeScript interfaces
└── constants/        # App constants
```

### Example Component Pattern
```typescript
// Define props interface
interface ButtonProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
}

// Functional component with hooks
const CustomButton: React.FC<ButtonProps> = ({
  onPress,
  title,
  disabled = false,
}) => {
  const styles = useStyles();
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.disabled]}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

export default CustomButton;
```

## Styling Guidelines

- Use `StyleSheet.create()` for all styles
- Define styles at the bottom of each component file or in a separate `.styles.ts` file for larger screens
- Use a consistent color palette defined in `constants/colors.ts`
- Responsive design: use percentages and `Dimensions` for flexible layouts
- Platform-specific styles: use `Platform.select()` or `.ios.tsx`/`.android.tsx` files when necessary

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
  },
});
```

## State Management

### Custom Hooks
Create custom hooks for shared logic:
```typescript
const useUserData = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const data = await userService.getUser();
      setUser(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, error, refetch: fetchUser };
};
```

### Context for App-wide State
Use Context for auth, theme, language preferences—not for frequently changing data.

## Error Handling & Validation

- Wrap async operations in try-catch blocks
- Use Error Boundaries for screen-level error handling
- Validate user input before API calls
- Show user-friendly error messages

```typescript
const handleSubmit = async (email: string) => {
  try {
    if (!isValidEmail(email)) {
      setError('Invalid email format');
      return;
    }
    await api.sendEmail(email);
    showSuccessMessage('Email sent!');
  } catch (error) {
    setError('Failed to send email. Please try again.');
    console.error('Email error:', error);
  }
};
```

## Performance Best Practices

- Use `React.memo()` for components that receive frequently changing props but render the same result
- Avoid inline function definitions in renders; use `useCallback()` instead
- Use `FlatList` with `keyExtractor` for rendering long lists, never use `ScrollView` with many items
- Lazy load screens with React Navigation's `lazy` prop
- Profile with React DevTools Profiler

```typescript
const ListItem = React.memo(({ item, onPress }: ListItemProps) => (
  <TouchableOpacity onPress={onPress}>
    <Text>{item.name}</Text>
  </TouchableOpacity>
));

const MyList = ({ items }: MyListProps) => {
  const handlePress = useCallback((item) => {
    navigation.navigate('Details', { id: item.id });
  }, [navigation]);

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ListItem item={item} onPress={() => handlePress(item)} />
      )}
    />
  );
};
```

## API Integration

- Keep all API calls in a `services/` folder
- Use a consistent error handling pattern
- Include loading and error states in components

```typescript
// services/userService.ts
export const userService = {
  getUser: async (id: string) => {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },
  
  updateUser: async (id: string, data: UserData) => {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },
};
```

## Testing

- Write unit tests for utility functions and custom hooks
- Write component tests for critical UI components
- Test user interactions and navigation flows

```typescript
describe('CustomButton', () => {
  it('should call onPress when pressed', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <CustomButton onPress={mockPress} title="Press me" />
    );
    fireEvent.press(getByText('Press me'));
    expect(mockPress).toHaveBeenCalled();
  });
});
```

## Code Quality

- ESLint config: use standard React Native + React hooks rules
- Prettier for formatting: 2-space indentation
- Type all props and function returns with TypeScript
- Add comments for complex logic only, code should be self-documenting
- Use descriptive variable names

## Common Patterns to Avoid

- ❌ Don't use `prop drilling` excessively—use Context or custom hooks
- ❌ Don't create inline styles in render methods
- ❌ Don't use `any` type in TypeScript
- ❌ Don't import from parent directories (`../../../`) excessively; restructure instead
- ❌ Don't handle API calls directly in component bodies; use custom hooks or services

## Version Control & Commits

- Keep commits focused and descriptive
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `test:`
- Test locally on both iOS and Android before committing

## Additional Resources

- [React Native Docs](https://reactnative.dev/)
- [React Navigation Docs](https://reactnavigation.org/)
- [React Hooks Rules](https://react.dev/reference/rules/rules-of-hooks)
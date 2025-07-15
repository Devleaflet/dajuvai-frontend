
import '../../Styles/Form.css';

interface FormFieldBaseProps {
  id: string;
  label: string;
  required?: boolean;
  helpText?: string;
  className?: string;
}

interface TextFieldProps extends FormFieldBaseProps {
  type: 'text' | 'number' | 'email' | 'password' | 'url';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

interface SelectFieldProps extends FormFieldBaseProps {
  type: 'select';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
}

interface CheckboxFieldProps extends FormFieldBaseProps {
  type: 'checkbox';
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface TextareaFieldProps extends FormFieldBaseProps {
  type: 'textarea';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
}

type FormFieldProps = TextFieldProps | SelectFieldProps | CheckboxFieldProps | TextareaFieldProps;

export const FormField: React.FC<FormFieldProps> = (props) => {
  const { id, label, required, helpText, className = '' } = props;

  switch (props.type) {
    case 'checkbox':
      return (
        <div className={`form-checkbox-group ${className}`}>
          <input
            type="checkbox"
            id={id}
            checked={props.checked}
            onChange={props.onChange}
            required={required}
          />
          <label htmlFor={id}>{label}</label>
          {helpText && <div className="form-help-text">{helpText}</div>}
        </div>
      );
    case 'select':
      return (
        <div className={`form-group ${className}`}>
          <label htmlFor={id}>{label}{required && <span className="required-mark">*</span>}</label>
          <select
            id={id}
            value={props.value}
            onChange={props.onChange}
            required={required}
          >
            {props.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {helpText && <div className="form-help-text">{helpText}</div>}
        </div>
      );
    case 'textarea':
      return (
        <div className={`form-group ${className}`}>
          <label htmlFor={id}>{label}{required && <span className="required-mark">*</span>}</label>
          <textarea
            id={id}
            value={props.value}
            onChange={props.onChange}
            placeholder={props.placeholder}
            rows={props.rows || 3}
            required={required}
          />
          {helpText && <div className="form-help-text">{helpText}</div>}
        </div>
      );
    default:
      return (
        <div className={`form-group ${className}`}>
          <label htmlFor={id}>{label}{required && <span className="required-mark">*</span>}</label>
          <input
            type={props.type}
            id={id}
            value={props.value}
            onChange={props.onChange}
            placeholder={props.placeholder}
            required={required}
          />
          {helpText && <div className="form-help-text">{helpText}</div>}
        </div>
      );
  }
};

interface FormProps {
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  className?: string;
}

const Form: React.FC<FormProps> = ({ onSubmit, children, className = '' }) => {
  return (
    <form onSubmit={onSubmit} className={`form ${className}`}>
      {children}
    </form>
  );
};

export default Form;

export const FormRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return <div className={`form-row ${className}`}>{children}</div>;
};

export const FormActions: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return <div className={`form-actions ${className}`}>{children}</div>;
};

export const Button: React.FC<{
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}> = ({ type = 'button', variant = 'secondary', onClick, children, disabled, className = '' }) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
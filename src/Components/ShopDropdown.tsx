

interface Option {
  value: string;
  label: string;
}

interface ShopDropdownProps {
  label: string;
  options: Option[];
  onChange: (value: string) => void;
}

const ShopDropdown: React.FC<ShopDropdownProps> = ({ label, options, onChange }) => {
    return (
      <div className="dropdown">
        <label>{label}</label>
        <select onChange={(e) => onChange(e.target.value)}>
          {options.map((option: Option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

export default ShopDropdown;
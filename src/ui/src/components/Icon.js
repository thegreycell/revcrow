import React from 'react';

// Simple wrapper component for Material Icons from CDN
const Icon = ({ name, ...props }) => (
  <span 
    className="material-icons" 
    style={{ verticalAlign: 'middle', ...props.style }}
    {...props}
  >
    {name}
  </span>
);

export default Icon;

// Common icons used in the app
export const HomeIcon = (props) => <Icon name="home" {...props} />;
export const MenuIcon = (props) => <Icon name="menu" {...props} />;
export const JobIcon = (props) => <Icon name="work" {...props} />;
export const ProductIcon = (props) => <Icon name="inventory_2" {...props} />;
export const SearchIcon = (props) => <Icon name="search" {...props} />;
export const AddIcon = (props) => <Icon name="add" {...props} />;
export const EditIcon = (props) => <Icon name="edit" {...props} />;
export const DeleteIcon = (props) => <Icon name="delete" {...props} />;
export const ArrowBackIcon = (props) => <Icon name="arrow_back" {...props} />;
export const RefreshIcon = (props) => <Icon name="refresh" {...props} />;

import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import SearchableSelect from './SearchableSelect';

const OPTIONS = [
  { value: 1, label: 'Pan de hamburguesa' },
  { value: 2, label: 'Queso cheddar' },
  { value: 3, label: 'Jamón' },
];

// Keeps the chosen value, as the forms do
function Form({ onChange = vi.fn(), initial = '' }) {
  const [value, setValue] = useState(initial);
  return (
    <SearchableSelect
      ariaLabel="Ingrediente 1"
      placeholder="Elige un ingrediente"
      options={OPTIONS}
      value={value}
      onChange={(chosen) => {
        setValue(chosen);
        onChange(chosen);
      }}
    />
  );
}

function optionNames() {
  return screen.queryAllByRole('option').map((option) => option.textContent);
}

describe('SearchableSelect', () => {
  it('opens with every option, like a select', () => {
    render(<Form />);
    const input = screen.getByRole('combobox', { name: 'Ingrediente 1' });
    expect(input).toHaveAttribute('placeholder', 'Elige un ingrediente');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    fireEvent.focus(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(optionNames()).toEqual(['Pan de hamburguesa', 'Queso cheddar', 'Jamón']);
  });

  it('filters the options while the user writes, without taking into account upper case or accents', () => {
    render(<Form />);
    const input = screen.getByRole('combobox', { name: 'Ingrediente 1' });
    fireEvent.focus(input);

    fireEvent.change(input, { target: { value: 'JAMON' } });
    expect(optionNames()).toEqual(['Jamón']);
    fireEvent.change(input, { target: { value: 'hamburguésa' } });
    expect(optionNames()).toEqual(['Pan de hamburguesa']);
    fireEvent.change(input, { target: { value: 'lechuga' } });
    expect(optionNames()).toEqual([]);
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
  });

  it('chooses an option with the mouse and shows its text', () => {
    const onChange = vi.fn();
    render(<Form onChange={onChange} />);
    const input = screen.getByRole('combobox', { name: 'Ingrediente 1' });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'que' } });
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Queso cheddar' }));

    expect(onChange).toHaveBeenCalledWith('2');
    expect(input).toHaveValue('Queso cheddar');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('chooses an option with the keyboard and closes with Escape', () => {
    const onChange = vi.fn();
    render(<Form onChange={onChange} />);
    const input = screen.getByRole('combobox', { name: 'Ingrediente 1' });

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('2');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows the chosen option again when the user leaves without choosing', () => {
    render(<Form initial="3" />);
    const input = screen.getByRole('combobox', { name: 'Ingrediente 1' });
    expect(input).toHaveValue('Jamón');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'pan' } });
    fireEvent.blur(input);
    expect(input).toHaveValue('Jamón');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

import { useId, useRef, useState } from 'react';
import { Form } from 'react-bootstrap';
import { normalizeForSearch } from '../utils/format';

// A drop-down list where the user can also write: it opens with every option, like a select, and while the user
// writes it shows only the options whose text contains what was written, without taking into account upper case
// or accents. options is a list of { value, label }; onChange receives the value of the chosen option.
export default function SearchableSelect({ options, value, onChange, placeholder, ariaLabel, className = '' }) {
  const listId = useId();
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(null); // null while the user has not written anything since it was opened
  const [active, setActive] = useState(0);
  const selected = options.find((option) => String(option.value) === String(value));
  const visible =
    query === null
      ? options
      : options.filter((option) => normalizeForSearch(option.label).includes(normalizeForSearch(query)));

  function openList() {
    setOpen(true);
    setQuery(null);
    setActive(Math.max(0, options.indexOf(selected)));
  }

  function close() {
    setOpen(false);
    setQuery(null);
  }

  function choose(option) {
    onChange(String(option.value));
    close();
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current) => Math.min(Math.max(current + step, 0), Math.max(visible.length - 1, 0)));
    } else if (event.key === 'Enter' && open) {
      event.preventDefault();
      if (visible[active]) {
        choose(visible[active]);
      }
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      close();
    }
  }

  return (
    <div className={`searchable-select ${className}`}>
      <Form.Control
        ref={inputRef}
        className="form-select"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder}
        value={query ?? selected?.label ?? ''}
        onFocus={(event) => {
          openList();
          event.target.select();
        }}
        onClick={() => !open && openList()}
        onChange={(event) => {
          setOpen(true);
          setQuery(event.target.value);
          setActive(0);
        }}
        onBlur={close}
        onKeyDown={handleKeyDown}
      />
      {open && (
        <ul id={listId} role="listbox" aria-label={`Opciones de ${ariaLabel}`} className="searchable-select-list">
          {visible.length === 0 && <li className="searchable-select-empty">Sin resultados</li>}
          {visible.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={String(option.value) === String(value)}
              className={index === active ? 'is-active' : undefined}
              // mousedown instead of click: it happens before the input loses the focus and closes the list
              onMouseDown={(event) => {
                event.preventDefault();
                choose(option);
              }}
              onMouseEnter={() => setActive(index)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

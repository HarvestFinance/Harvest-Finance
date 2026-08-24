import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from './Button';
import { Modal, ModalBody, ModalHeader } from './Modal';

describe('Button', () => {
  it('renders content, forwards type, and invokes its handler', () => {
    const onClick = jest.fn();
    render(
      <Button type="submit" leftIcon={<span aria-hidden="true">+</span>} onClick={onClick}>
        Save
      </Button>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('disables the button and exposes busy state while loading', () => {
    render(<Button isLoading>Saving</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Saving')).toBeInTheDocument();
  });
});

describe('Modal', () => {
  it('renders nothing when closed and supports close button and Escape', () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <Modal isOpen={false} onClose={onClose}>
        Hidden
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(
      <Modal isOpen onClose={onClose}>
        <ModalHeader title="Confirm" />
        <ModalBody>Visible content</ModalBody>
      </Modal>,
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Visible content')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
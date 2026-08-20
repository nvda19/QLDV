import React, { createContext, useContext, useState } from 'react';
import ConfirmModal from '../components/common/ConfirmModal';

const ConfirmContext = createContext();

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export const ConfirmProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: 'Xác nhận',
    message: '',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy bỏ',
    variant: 'danger',
    resolve: null,
  });

  const confirm = (options = {}) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title: options.title || 'Xác nhận',
        message: options.message || 'Bạn có chắc chắn muốn thực hiện hành động này?',
        confirmText: options.confirmText || 'Xác nhận',
        cancelText: options.cancelText || 'Hủy bỏ',
        variant: options.variant || 'danger',
        resolve,
      });
    });
  };

  const handleConfirm = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (modalState.resolve) {
      modalState.resolve(true);
    }
  };

  const handleCancel = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (modalState.resolve) {
      modalState.resolve(false);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        variant={modalState.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
};

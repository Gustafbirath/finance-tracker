import './index.css';
import { useState, useEffect } from 'react';
import { App, Tabbar, TabbarLink, Icon, Fab, Toast } from 'konsta/react';
import { BsHouseFill, BsCashStack } from 'react-icons/bs';
import { FaRegFilePdf } from 'react-icons/fa6';
import { MdHome, MdAttachMoney } from 'react-icons/md';
import { HomePage } from './pages/HomePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { useExpenses } from './hooks/useExpenses';
import { usePDFUpload, receiptDataToExpense } from './hooks/usePDFUpload';

type ActiveTab = 'home' | 'expenses';

function Root() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const {
    expenses,
    categories,
    error: expensesError,
    addExpense,
    filterByCategory,
    filterByPeriod,
  } = useExpenses();

  const {
    uploading,
    error: uploadError,
    parsedData,
    uploadPDF,
    triggerFileInput,
    reset: resetUpload,
    fileInputRef,
  } = usePDFUpload();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter expenses by selected period on home page (only on mount and tab change)
  useEffect(() => {
    if (activeTab === 'home') {
      filterByPeriod('month');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // Only depend on activeTab, not filterByPeriod

  // Handle parsed PDF data
  useEffect(() => {
    if (parsedData) {
      const expenseData = receiptDataToExpense(parsedData);

      addExpense(expenseData)
        .then(() => {
          setToastMessage('Expense added successfully!');
          resetUpload();
        })
        .catch((err) => {
          setToastMessage('Failed to add expense');
          console.error('Error adding expense:', err);
        });
    }
  }, [parsedData, addExpense, resetUpload]);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadPDF(file);
    }
  };

  // Show error messages
  useEffect(() => {
    if (uploadError) {
      setToastMessage(uploadError);
    }
  }, [uploadError]);

  useEffect(() => {
    if (expensesError) {
      setToastMessage(expensesError);
    }
  }, [expensesError]);

  return (
    <App theme="ios" safeAreas>
      {/* Hidden file input for PDF/image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Page Content */}
      <div>
        {activeTab === 'home' && <HomePage expenses={expenses} />}
        {activeTab === 'expenses' && (
          <ExpensesPage
            expenses={expenses}
            categories={categories}
            onCategoryChange={filterByCategory}
          />
        )}
      </div>

      {/* Bottom Tabbar */}
      <Tabbar labels icons className="left-0 bottom-0 fixed">
        <TabbarLink
          active={activeTab === 'home'}
          onClick={() => setActiveTab('home')}
          icon={
            <Icon
              ios={<BsHouseFill className="w-7 h-7" />}
              material={<MdHome className="w-6 h-6" />}
            />
          }
          label="Home"
        />
        <TabbarLink
          active={activeTab === 'expenses'}
          onClick={() => setActiveTab('expenses')}
          icon={
            <Icon
              ios={<BsCashStack className="w-7 h-7" />}
              material={<MdAttachMoney className="w-6 h-6" />}
            />
          }
          label="Expenses"
        />
      </Tabbar>

      {/* FAB for PDF Upload */}
      {!uploading && (
        <Fab
          className="fixed right-4 top-20 z-20 bg-gray-800 shadow-lg flex items-center justify-center"
          icon={<FaRegFilePdf className="w-5 h-5" />}
          onClick={triggerFileInput}
        />
      )}

      {/* Loading indicator on FAB */}
      {uploading && (
        <div className="fixed right-4 top-20 z-30 bg-white dark:bg-gray-800 rounded-full p-4 shadow-lg">
          <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full" />
        </div>
      )}

      {/* Toast Notifications */}
      {toastMessage && (
        <Toast
          opened={true}
          position="center"
          button={
            <div onClick={() => setToastMessage(null)} className="cursor-pointer">
              Close
            </div>
          }
        >
          <div className="text-center">{toastMessage}</div>
        </Toast>
      )}
    </App>
  );
}

export default Root;

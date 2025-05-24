import React from 'react';
import { QrCodeIcon } from 'lucide-react';
import toiralLogo from '../assets/toiral-logo-new.png';

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  unit?: string;
}

export interface InvoiceTemplateProps {
  invoiceNumber: string;
  invoiceDate?: string;
  date?: string; // Alternative field for invoiceDate
  dueDate: string;
  clientName: string;
  clientAddress: string;
  clientPhone?: string;
  clientEmail?: string;
  items: InvoiceItem[];
  notes?: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paymentInfo: {
    bank: string;
    accountNumber: string;
    swift: string;
  };
  qrCodeUrl?: string;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  invoiceNumber,
  invoiceDate,
  date,
  dueDate,
  clientName,
  clientAddress,
  clientPhone,
  clientEmail,
  items,
  notes,
  subtotal,
  taxRate,
  taxAmount,
  total,
  paymentInfo,
  qrCodeUrl
}) => {
  // Use either invoiceDate or date, whichever is available
  const displayDate = invoiceDate || date || 'N/A';
  return (
    <div className="invoice-template w-full h-full bg-white text-[#0F3048] font-sans p-6 max-w-4xl mx-auto rounded-xl border border-[#f5f0e8] print-break-inside-avoid">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 print-break-inside-avoid">
        <div className="flex flex-col">
          <div className="mb-1">
            <img src={toiralLogo} alt="Toiral Logo" className="h-12 w-auto object-contain" />
          </div>
          <p className="text-[#0F3048] text-sm mt-1">Imagine, Develop, Deploy</p>
        </div>

        <div className="text-right">
          <h1 className="text-[#0F3048] text-4xl font-bold">INVOICE</h1>
        </div>
      </div>

      {/* Client and Invoice Info */}
      <div className="flex flex-col md:flex-row justify-between mb-8">
        {/* Client Info */}
        <div className="mb-4 md:mb-0 max-w-xs">
          <h2 className="font-medium text-base mb-1">{clientName}</h2>
          <p className="text-[#0F3048] text-sm whitespace-pre-line">{clientAddress}</p>
          {clientPhone && <p className="text-[#0F3048] text-sm">Phone: {clientPhone}</p>}
          {clientEmail && <p className="text-[#0F3048] text-sm">Email: {clientEmail}</p>}
        </div>

        {/* Invoice Details */}
        <div className="border border-[#0F3048] w-full md:w-auto md:min-w-[300px]">
          <div className="flex border-b border-[#0F3048]">
            <div className="w-32 p-2 border-r border-[#0F3048] font-medium text-sm">Invoice Date</div>
            <div className="p-2 flex-1 text-right text-sm">{displayDate}</div>
          </div>
          <div className="flex border-b border-[#0F3048]">
            <div className="w-32 p-2 border-r border-[#0F3048] font-medium text-sm">Due Date</div>
            <div className="p-2 flex-1 text-right text-sm">{dueDate}</div>
          </div>
          <div className="flex">
            <div className="w-32 p-2 border-r border-[#0F3048] font-medium text-sm">Invoice #</div>
            <div className="p-2 flex-1 text-right text-sm">{invoiceNumber}</div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6 print-break-inside-avoid">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#0F3048] text-white">
              <th className="p-2 text-left text-sm font-medium">Description</th>
              <th className="p-2 text-center w-20 text-sm font-medium">Quantity</th>
              <th className="p-2 text-right w-20 text-sm font-medium">Rate</th>
              <th className="p-2 text-right w-20 text-sm font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {items.map((item, index) => (
              <tr key={index} className="border-b border-[#0F3048] print-break-inside-avoid">
                <td className="p-2 text-left text-sm">{item.description}</td>
                <td className="p-2 text-center text-sm">{item.quantity}</td>
                <td className="p-2 text-right text-sm">${item.rate.toFixed(2)}</td>
                <td className="p-2 text-right text-sm">${item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes and Summary */}
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <div className="w-full md:w-1/2 pr-0 md:pr-8 mb-4 md:mb-0">
          <h3 className="text-sm font-medium mb-1 text-[#0F3048]">Notes</h3>
          <p className="text-[#0F3048] text-sm">{notes || "Let's craft digital experiences that feel just right."}</p>
        </div>

        <div className="w-full md:w-1/2">
          <div>
            <div className="flex border-b border-[#0F3048]">
              <div className="p-2 font-medium text-sm">Subtotal</div>
              <div className="p-2 ml-auto text-sm">${subtotal.toFixed(2)}</div>
            </div>
            <div className="flex border-b border-[#0F3048]">
              <div className="p-2 font-medium text-sm">Tax ({taxRate}%)</div>
              <div className="p-2 ml-auto text-sm">${taxAmount.toFixed(2)}</div>
            </div>
            <div className="flex bg-[#0F3048] text-white">
              <div className="p-2 font-medium text-sm">Total</div>
              <div className="p-2 ml-auto text-sm">${total.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2 text-[#0F3048]">Payment Information</h3>
        <div className="grid grid-cols-1 gap-1">
          <div className="flex">
            <p className="text-[#0F3048] font-medium w-24 text-sm">Bank</p>
            <p className="text-[#0F3048] text-sm">{paymentInfo.bank}</p>
          </div>
          <div className="flex">
            <p className="text-[#0F3048] font-medium w-24 text-sm">Account #</p>
            <p className="text-[#0F3048] text-sm">{paymentInfo.accountNumber}</p>
          </div>
          <div className="flex">
            <p className="text-[#0F3048] font-medium w-24 text-sm">Swift</p>
            <p className="text-[#0F3048] text-sm">{paymentInfo.swift}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex flex-col md:flex-row justify-between items-center">
        <div className="bg-[#0F3048] text-white p-4 rounded-md w-full md:w-3/4 mb-4 md:mb-0">
          <p className="text-sm mb-2">Thank you for partnering with Toiral</p>
          <div className="border-l-2 border-[#26A69A] pl-2 my-2">
            <p className="text-xs mb-2">
              We truly appreciate the trust you've placed in us to bring your
              digital vision to life. Your ongoing support is vital to our
              continued growth, and we're committed to being a valuable part of
              your journey.
            </p>
            <p className="text-xs mb-2">
              If you have any questions or need further support, we're just a
              message away.
            </p>
          </div>
          <p className="text-xs italic">imagine, develop, and deploy.</p>
          <p className="text-xs mt-1">Warm regards,</p>
          <p className="text-xs">Team Toiral</p>
        </div>

        <div className="w-full md:w-1/4 flex justify-center md:justify-end">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="QR Code" className="w-28 h-28 bg-white p-2 rounded-md" />
          ) : (
            <div className="w-28 h-28 bg-white p-2 rounded-md flex items-center justify-center">
              <QrCodeIcon className="w-20 h-20 text-[#0F3048]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplate;

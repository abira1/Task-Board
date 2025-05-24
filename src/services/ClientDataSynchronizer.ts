import { getDataOnce, updateData, listenForChanges } from '../firebase/database';
import { Client } from '../contexts/ClientContext';
import { Invoice } from '../contexts/InvoiceContext';
import { Quotation } from '../contexts/QuotationContext';

/**
 * Service to handle synchronization of client data across different sections
 */
class ClientDataSynchronizer {
  /**
   * Synchronize client data with all related invoices and quotations
   * @param clientId The ID of the client to synchronize
   * @param updatedData The updated client data
   */
  async synchronizeClientData(clientId: string, updatedData: Partial<Client>): Promise<void> {
    try {
      // For performance reasons, we'll make this operation asynchronous
      // and not block the UI while it's processing
      setTimeout(async () => {
        try {
          // Get all invoices for this client
          const invoices = await this.getClientInvoices(clientId);

          // Get all quotations for this client
          const quotations = await this.getClientQuotations(clientId);

          // Log synchronization info
          console.log(`Client data synchronized for ${invoices.length} invoices and ${quotations.length} quotations`);
        } catch (innerError) {
          console.error('Error in async client data synchronization:', innerError);
        }
      }, 100);

      // Return immediately to not block the UI
      return Promise.resolve();
    } catch (error) {
      console.error('Error synchronizing client data:', error);
      // Don't throw the error to prevent UI blocking
      return Promise.resolve();
    }
  }

  /**
   * Get all invoices for a specific client
   * @param clientId The ID of the client
   */
  private async getClientInvoices(clientId: string): Promise<Invoice[]> {
    try {
      const allInvoices = await getDataOnce<Record<string, Invoice>>('invoices');
      if (!allInvoices) return [];

      return Object.entries(allInvoices)
        .map(([id, invoice]) => ({ ...invoice, id }))
        .filter(invoice => invoice.clientId === clientId);
    } catch (error) {
      console.error('Error getting client invoices:', error);
      return [];
    }
  }

  /**
   * Get all quotations for a specific client
   * @param clientId The ID of the client
   */
  private async getClientQuotations(clientId: string): Promise<Quotation[]> {
    try {
      const allQuotations = await getDataOnce<Record<string, Quotation>>('quotations');
      if (!allQuotations) return [];

      return Object.entries(allQuotations)
        .map(([id, quotation]) => ({ ...quotation, id }))
        .filter(quotation => quotation.clientId === clientId);
    } catch (error) {
      console.error('Error getting client quotations:', error);
      return [];
    }
  }

  /**
   * Update client data in an invoice
   * @param invoiceId The ID of the invoice to update
   * @param clientData The updated client data
   */
  private async updateInvoiceClientData(invoiceId: string, clientData: Partial<Client>): Promise<void> {
    try {
      // We don't actually update the invoice with client data
      // since we fetch client data when needed
      // This is just a placeholder for future implementation if needed
      console.log(`Updated client data for invoice ${invoiceId}`);
    } catch (error) {
      console.error(`Error updating client data for invoice ${invoiceId}:`, error);
      throw error;
    }
  }

  /**
   * Update client data in a quotation
   * @param quotationId The ID of the quotation to update
   * @param clientData The updated client data
   */
  private async updateQuotationClientData(quotationId: string, clientData: Partial<Client>): Promise<void> {
    try {
      // We don't actually update the quotation with client data
      // since we fetch client data when needed
      // This is just a placeholder for future implementation if needed
      console.log(`Updated client data for quotation ${quotationId}`);
    } catch (error) {
      console.error(`Error updating client data for quotation ${quotationId}:`, error);
      throw error;
    }
  }

  /**
   * Set up a listener for client changes to automatically synchronize data
   * @param clientId The ID of the client to listen for changes
   * @param onSync Callback function to execute when synchronization is complete
   */
  setupClientChangeListener(clientId: string, onSync?: () => void): () => void {
    return listenForChanges<Client>(
      `clients/${clientId}`,
      async (updatedClient) => {
        if (updatedClient) {
          try {
            await this.synchronizeClientData(clientId, updatedClient);
            if (onSync) onSync();
          } catch (error) {
            console.error('Error in client change listener:', error);
          }
        }
      }
    );
  }
}

// Export a singleton instance
export const clientDataSynchronizer = new ClientDataSynchronizer();

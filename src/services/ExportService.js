import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export const exportTransactionsToPDF = async (transactions, currencySymbol, userName) => {
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Expense Report</title>
            <style>
                body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                .summary { margin-bottom: 20px; display: flex; justify-content: space-between; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background-color: #f8f9fa; text-align: left; padding: 12px; border-bottom: 2px solid #dee2e6; }
                td { padding: 12px; border-bottom: 1px solid #dee2e6; }
                .amount-expense { color: #dc3545; font-weight: bold; }
                .amount-income { color: #28a745; font-weight: bold; }
                .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #6c757d; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Wallety Expense Report</h1>
                <p>Generated for: ${userName || 'Valued User'}</p>
                <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.map(t => `
                        <tr>
                            <td>${t.date}</td>
                            <td>${t.title}</td>
                            <td>${t.category?.name || 'Income'}</td>
                            <td class="${t.type === 'expense' ? 'amount-expense' : 'amount-income'}">
                                ${t.type === 'expense' ? '-' : '+'}${currencySymbol}${Number(t.amount).toFixed(2)}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="footer">
                <p>Created with Wallety - Your Personal Finance Assistant</p>
            </div>
        </body>
        </html>
    `;

    try {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        if (Platform.OS === 'ios') {
            await Sharing.shareAsync(uri);
        } else {
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        }
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};

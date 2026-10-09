// Every debt has these fields.
interface BaseDebt {
  id: string;
  lenderName: string;
  originalBalance: number;
  remainingBalance: number;
  interestRate: number; // percentage, e.g. 5.5
  minimumMonthlyPayment: number;
  dueDate: Date;
}

export interface CreditCardDebt extends BaseDebt {
  type: 'credit_card';
  creditLimit: number;
  isIntroductoryRateActive: boolean;
  introductoryRateExpiryDate?: Date;
}

export interface MortgageDebt extends BaseDebt {
  type: 'mortgage';
  propertyAddress: string;
  termLengthYears: number; // e.g. 15, 30
  escrowAmountMonthly?: number;
  mortgageType: 'fixed' | 'variable';
}

export interface StudentLoanDebt extends BaseDebt {
  type: 'student_loan';
  servicer: string;
  isSubsidized: boolean;
  repaymentPlan: 'standard' | 'graduated' | 'income_driven' | 'deferred';
}

export interface AutoLoanDebt extends BaseDebt {
  type: 'auto_loan';
  vehicleVin?: string;
  termLengthMonths: number; // e.g. 60, 72
}

export interface PersonalLoanDebt extends BaseDebt {
  type: 'personal_loan';
  termLengthMonths: number;
  isSecured: boolean;
}

// The discriminated union: `type` tells TypeScript which variant you have.
export type Debt =
  | CreditCardDebt
  | MortgageDebt
  | StudentLoanDebt
  | AutoLoanDebt
  | PersonalLoanDebt;

// TODO 8: assertNever(x: never): never. Throw an Error that names the value.

export function getDebtSummary(debt: Debt): string {
  switch (debt.type) {
    case 'credit_card': {
      // Narrowed to CreditCardDebt, so creditLimit exists here.
      const utilization = ((debt.remainingBalance / debt.creditLimit) * 100).toFixed(1);
      return `Credit Card (${debt.lenderName}): $${debt.remainingBalance} balance (${utilization}% limit used)`;
    }
    case 'mortgage':
      return `${debt.mortgageType.toUpperCase()} Mortgage for ${debt.propertyAddress}: $${debt.remainingBalance} remaining`;
    case 'student_loan':
      return `Student Loan via ${debt.servicer} (${debt.repaymentPlan} plan): $${debt.remainingBalance}`;
    case 'auto_loan':
    case 'personal_loan':
      return `${debt.lenderName} Loan: $${debt.remainingBalance} (${debt.termLengthMonths} mo term)`;
    // TODO 8: a default case that calls assertNever(debt).
  }
  return 'unknown debt';
}

// TODO 9: DebtOfType<K>: the member of Debt whose `type` is K.
//         (Look up the built-in utility type Extract.)
// TODO 10: filterByType(debts, type) returns only that variant, typed as such:
//          filterByType(debts, 'mortgage') is MortgageDebt[].
export function filterByType(debts: Debt[], type: string): Debt[] {
  return debts.filter((d) => d.type === type);
}

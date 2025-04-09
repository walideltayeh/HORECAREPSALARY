import { SalaryCalculator } from '@/components/salary/SalaryCalculator';

export default function Salary() {
  return (
    <section id="salary" className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Salary Calculation</h2>
      <SalaryCalculator />
    </section>
  );
}

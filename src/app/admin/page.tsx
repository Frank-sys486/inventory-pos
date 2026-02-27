"use client";
import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartTooltipContent,
  ChartTooltip,
  ChartContainer,
  ChartConfig,
} from "@/components/ui/chart";
import { Loader2Icon, TrendingUp } from "lucide-react";
import {
  Pie,
  PieChart,
  CartesianGrid,
  XAxis,
  Bar,
  BarChart,
  Line,
  LineChart,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const pad = (left: string, right: string, width = 28) => {
  const leftStr = String(left);
  const rightStr = String(right);
  const space = width - leftStr.length - rightStr.length;
  if (space < 0) return leftStr + " " + rightStr;
  return leftStr + " ".repeat(space) + rightStr;
};

const center = (text: string, width = 28) => {
  const str = String(text);
  const space = Math.max(0, width - str.length);
  const left = Math.floor(space / 2);
  return " ".repeat(left) + str;
};

export default function Page() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [cashFlow, setCashFlow] = useState<{ date: string; amount: unknown }[]>([]);
  const [revenueByCategory, setRevenueByCategory] = useState({});
  const [expensesByCategory, setExpensesByCategory] = useState({});
  const [profitMargin, setProfitMargin] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receiptContent, setReceiptContent] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          revenueRes,
          expensesRes,
          profitRes,
          cashFlowRes,
          revenueByCategoryRes,
          expensesByCategoryRes,
          profitMarginRes
        ] = await Promise.all([
          fetch('/api/admin/revenue/total'),
          fetch('/api/admin/expenses/total'),
          fetch('/api/admin/profit/total'),
          fetch('/api/admin/cashflow'),
          fetch('/api/admin/revenue/category'),
          fetch('/api/admin/expenses/category'),
          fetch('/api/admin/profit/margin')
        ]);

        const revenue = await revenueRes.json();
        const expenses = await expensesRes.json();
        const profit = await profitRes.json();
        const cashFlowData = await cashFlowRes.json();
        const revenueByCategoryData = await revenueByCategoryRes.json();
        const expensesByCategoryData = await expensesByCategoryRes.json();
        const profitMarginData = await profitMarginRes.json();

        setTotalRevenue(revenue.totalRevenue);
        setTotalExpenses(expenses.totalExpenses);
        setTotalProfit(profit.totalProfit);
        setCashFlow(Object.entries(cashFlowData.cashFlow).map(([date, amount]) => ({ date, amount })));
        setRevenueByCategory(revenueByCategoryData.revenueByCategory);
        setExpensesByCategory(expensesByCategoryData.expensesByCategory);
        setProfitMargin(profitMarginData.profitMargin);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePrintSummary = () => {
    let content = "";
    const shopName = "FIN OPEN POS";
    const address = "123 COMMERCE AVENUE";
    const phone = "TEL: (555) 019-8372";
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    const charWidth = 28;
    const line = "-".repeat(charWidth);
    const dash = "- ".repeat(charWidth / 2).trim();

    // Header Section
    content += `<div style="text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 2px;">${shopName.toUpperCase()}</div>`;
    content += center(address.toUpperCase(), charWidth) + "\n";
    content += center(phone.toUpperCase(), charWidth) + "\n";
    content += dash + "\n";

    // Meta Info
    content += pad("DATE:", `${date} ${time}`, charWidth) + "\n";
    content += pad("RCPT:", "#SUMMARY", charWidth) + "\n";
    content += pad("CASHIER:", "ADMIN", charWidth) + "\n";
    content += dash + "\n";

    // Headers
    content += pad("DESCRIPTION", "TOTAL", charWidth) + "\n";
    content += line + "\n";

    // Data Rows
    content += pad("TOTAL REVENUE", totalRevenue.toFixed(2), charWidth) + "\n";
    content += pad("TOTAL EXPENSES", totalExpenses.toFixed(2), charWidth) + "\n";
    content += dash + "\n";

    // Calculations
    content += pad("SUBTOTAL", totalProfit.toFixed(2), charWidth) + "\n";
    content += pad("TAX (0.0%)", "0.00", charWidth) + "\n";
    content += `<div style="font-weight: bold; border-top: 1px solid black; margin-top: 4px; padding-top: 2px;">${pad("NET PROFIT", totalProfit.toFixed(2), charWidth)}</div>`;
    content += dash + "\n";

    // Categories Section
    if (Object.keys(revenueByCategory).length > 0) {
      content += center("REVENUE BY CATEGORY", charWidth) + "\n";
      Object.entries(revenueByCategory).forEach(([cat, val]) => {
        content += pad(cat.toUpperCase().substring(0, 16), (val as number).toFixed(2), charWidth) + "\n";
      });
      content += dash + "\n";
    }

    content += "\n";
    // Footer
    content += center("*** END OF REPORT ***", charWidth) + "\n";
    content += center("FIN OPEN POS SYSTEM", charWidth) + "\n";
    content += "\n";
    content += center("882910394812", charWidth) + "\n";
    content += "\n\n\n";

    setReceiptContent(content);

    setTimeout(() => {
      window.print();
    }, 150);
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2Icon className="mx-auto h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid flex-1 items-start gap-4 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={handlePrintSummary} variant="outline">
          Print Summary
        </Button>
      </div>
      <div className="grid auto-rows-max items-start gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSignIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <DollarSignIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Profit (selling)</CardTitle>
            <DollarSignIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalProfit)}</div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Revenue by Category
            </CardTitle>
            <PieChartIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <PiechartcustomChart data={revenueByCategory} className="aspect-auto" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Expenses by Category
            </CardTitle>
            <PieChartIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <PiechartcustomChart data={expensesByCategory} className="aspect-auto" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin (selling)</CardTitle>
            <BarChartIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <BarchartChart data={profitMargin} className="aspect-auto" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
            <DollarSignIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <LinechartChart data={cashFlow} className="aspect-auto" />
          </CardContent>
        </Card>
      </div>

      {/* Hidden Receipt for Printing - Exact styling from POS */}
      <div className="hidden print:flex print:justify-center w-full">
        <div 
          id="printable-receipt" 
          className="font-['Courier_New',_Courier,_monospace] text-[14px] leading-[1.2] w-[48mm] whitespace-pre-wrap text-black p-0 m-0"
          dangerouslySetInnerHTML={{ __html: receiptContent }}
        />
      </div>
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: 58mm auto;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 58mm !important;
          }
        }
      `}</style>
    </div>
  );
}

function BarChartIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}

function BarchartChart({ data, ...props }: { data: any[] } & React.HTMLAttributes<HTMLDivElement>) {
  const chartConfig = {
    margin: {
      label: "Margin",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;
  return (
    <div {...props}>
      <ChartContainer config={chartConfig}>
        <BarChart accessibilityLayer data={data}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dashed" />}
          />
          <Bar dataKey="margin" fill="var(--color-margin)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function DollarSignIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function LinechartChart({ data, ...props }: { data: any[] } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props}>
      <ChartContainer
        config={{
          amount: {
            label: "Amount",
            color: "hsl(var(--chart-1))",
          },
        }}
      >
        <LineChart
          accessibilityLayer
          data={data}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Line
            dataKey="amount"
            type="monotone"
            stroke="var(--color-amount)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

function PieChartIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}

function PiechartcustomChart({ data, ...props }: { data: Record<string, number> } & React.HTMLAttributes<HTMLDivElement>) {
  const chartData = Object.entries(data).map(([category, value]) => ({
    category,
    value,
    fill: `var(--color-${category})`,
  }));

  const chartConfig = Object.fromEntries(
    Object.keys(data).map((category, index) => [
      category,
      {
        label: category,
        color: `hsl(var(--chart-${index + 1}))`,
      },
    ])
  ) as ChartConfig;

  return (
    <div {...props}>
      <ChartContainer config={chartConfig}>
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="category"
            outerRadius={80}
          />
        </PieChart>
      </ChartContainer>
    </div>
  );
}


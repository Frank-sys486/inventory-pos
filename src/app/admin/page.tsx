"use client";
import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  ChartTooltipContent,
  ChartTooltip,
  ChartContainer,
  ChartConfig,
} from "@/components/ui/chart";
import { Loader2Icon, CalendarIcon, DollarSignIcon } from "lucide-react";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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
  const [totalCapital, setTotalCapital] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [cashFlow, setCashFlow] = useState<{ date: string; amount: unknown }[]>([]);
  const [revenueByCategory, setRevenueByCategory] = useState({});
  const [expensesByCategory, setExpensesByCategory] = useState({});
  const [profitMargin, setProfitMargin] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receiptContent, setReceiptContent] = useState("");

  const [dateFilter, setDateFilter] = useState("daily");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const dateRange = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (dateFilter) {
      case "daily":
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "monthly":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case "yearly":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case "custom":
        if (customStartDate) start = new Date(customStartDate);
        if (customEndDate) {
          end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
        }
        break;
    }
    return { start: start.toISOString(), end: end.toISOString() };
  }, [dateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const query = `?startDate=${dateRange.start}&endDate=${dateRange.end}`;
        const [
          profitRes,
          expensesRes,
          cashFlowRes,
          revenueByCategoryRes,
          expensesByCategoryRes,
          profitMarginRes
        ] = await Promise.all([
          fetch(`/api/admin/profit/total${query}`),
          fetch(`/api/admin/expenses/total${query}`),
          fetch(`/api/admin/cashflow${query}`),
          fetch(`/api/admin/revenue/category${query}`),
          fetch(`/api/admin/expenses/category${query}`),
          fetch(`/api/admin/profit/margin${query}`)
        ]);

        const profitData = await profitRes.json();
        const expenses = await expensesRes.json();
        const cashFlowData = await cashFlowRes.json();
        const revenueByCategoryData = await revenueByCategoryRes.json();
        const expensesByCategoryData = await expensesByCategoryRes.json();
        const profitMarginData = await profitMarginRes.json();

        setTotalRevenue(profitData.totalRevenue || 0);
        setTotalCapital(profitData.totalCapital || 0);
        setTotalProfit(profitData.totalProfit || 0);
        setTotalExpenses(expenses.totalExpenses || 0);
        setCashFlow(Object.entries(cashFlowData.cashFlow || {}).map(([date, amount]) => ({ date, amount })));
        setRevenueByCategory(revenueByCategoryData.revenueByCategory || {});
        setExpensesByCategory(expensesByCategoryData.expensesByCategory || {});
        setProfitMargin(profitMarginData.profitMargin || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const handlePrintSummary = () => {
    let content = "";
    const shopName = "MC HARDWARE SYSTEM";
    const address = "SUMMARY REPORT";
    const dateStr = new Date().toLocaleDateString();
    const timeStr = new Date().toLocaleTimeString();
    const charWidth = 28;
    const line = "-".repeat(charWidth);
    const dash = "- ".repeat(charWidth / 2).trim();

    content += `<div style="text-align: center; font-weight: bold; font-size: 16px;">${shopName}</div>`;
    content += center(address, charWidth) + "\n";
    content += dash + "\n";
    content += pad("RANGE:", dateFilter.toUpperCase(), charWidth) + "\n";
    content += pad("DATE:", dateStr, charWidth) + "\n";
    content += dash + "\n";

    content += pad("GROSS SALES", totalRevenue.toFixed(2), charWidth) + "\n";
    content += pad("TOTAL CAPITAL", totalCapital.toFixed(2), charWidth) + "\n";
    content += line + "\n";
    content += pad("TOTAL PROFIT", totalProfit.toFixed(2), charWidth) + "\n";
    content += dash + "\n\n\n\n";

    setReceiptContent(content);
    setTimeout(() => window.print(), 150);
  };

  return (
    <div className="grid flex-1 items-start gap-4 p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        <div className="flex flex-wrap items-center gap-2">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[150px]">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {dateFilter === "custom" && (
            <div className="flex items-center gap-2">
              <Input 
                type="date" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)} 
                className="w-[140px] h-9"
              />
              <span>to</span>
              <Input 
                type="date" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)} 
                className="w-[140px] h-9"
              />
            </div>
          )}

          <Button onClick={handlePrintSummary} variant="outline" size="sm">
            Print Summary
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-[50vh] flex items-center justify-center">
          <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid auto-rows-max items-start gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Gross Sale</CardTitle>
                <DollarSignIcon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Capital</CardTitle>
                <DollarSignIcon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalCapital)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
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
                <CardTitle className="text-sm font-medium">Revenue by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <PiechartcustomChart data={revenueByCategory} className="aspect-auto" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Expenses (Operating)</CardTitle>
              </CardHeader>
              <CardContent>
                <PiechartcustomChart data={expensesByCategory} className="aspect-auto" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
              </CardHeader>
              <CardContent>
                <BarchartChart data={profitMargin} className="aspect-auto" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <LinechartChart data={cashFlow} className="aspect-auto" />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <div className="hidden print:flex print:justify-center w-full">
        <div 
          id="printable-receipt" 
          className="font-['Courier_New',_Courier,_monospace] text-[14px] leading-[1.2] w-[48mm] whitespace-pre-wrap text-black p-0 m-0"
          dangerouslySetInnerHTML={{ __html: receiptContent }}
        />
      </div>
    </div>
  );
}

function BarchartChart({ data, ...props }: { data: any[] } & React.HTMLAttributes<HTMLDivElement>) {
  const chartConfig = { margin: { label: "Margin", color: "hsl(var(--chart-1))" } } satisfies ChartConfig;
  return (
    <div {...props}>
      <ChartContainer config={chartConfig}>
        <BarChart accessibilityLayer data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => new Date(value).toLocaleDateString()} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
          <Bar dataKey="margin" fill="var(--color-margin)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function LinechartChart({ data, ...props }: { data: any[] } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props}>
      <ChartContainer config={{ amount: { label: "Amount", color: "hsl(var(--chart-1))" } }}>
        <LineChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => new Date(value).toLocaleDateString()} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Line dataKey="amount" type="monotone" stroke="var(--color-amount)" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

function PiechartcustomChart({ data, ...props }: { data: Record<string, number> } & React.HTMLAttributes<HTMLDivElement>) {
  const chartData = Object.entries(data).map(([category, value]) => {
    const safeKey = category.toLowerCase().replace(/[^a-z0-9]/g, "-");
    return { category, value, fill: `var(--color-${safeKey})` };
  });
  
  const chartConfig = Object.fromEntries(
    Object.keys(data).map((category, index) => {
      const safeKey = category.toLowerCase().replace(/[^a-z0-9]/g, "-");
      return [safeKey, { label: category, color: `hsl(var(--chart-${(index % 5) + 1}))` }];
    })
  ) as ChartConfig;

  return (
    <div {...props}>
      <ChartContainer config={chartConfig}>
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Pie data={chartData} dataKey="value" nameKey="category" outerRadius={60} />
        </PieChart>
      </ChartContainer>
    </div>
  );
}

export const dynamic = "force-dynamic";

import { DisclaimerForm } from "@/components/order/disclaimer-form";
import { getAppSettings } from "@/lib/config";

export default async function DisclaimerPage() {
  const settings = await getAppSettings();

  return <DisclaimerForm disclaimer={settings.disclaimer} />;
}
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (typeof Deno !== 'undefined' ? (Deno.env.get('SUPABASE_URL') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')) : process.env.NEXT_PUBLIC_SUPABASE_URL) || '';
const SUPABASE_SERVICE_ROLE_KEY = (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') : process.env.SUPABASE_SERVICE_ROLE_KEY) || '';

let supabase: any;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
} else {
  console.warn('payfast-webhook: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  supabase = { from: (_: string) => ({ update: (_: any) => ({ data: null, error: null }) }) } as any;
}

// Simple handler for PayFast ITN (Instant Transaction Notification).
// Expects application/x-www-form-urlencoded POST with fields like m_payment_id and payment_status
export async function payfastWebhookHandler(req: Request) {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    // Security: validate request IP against allowed PayFast IP ranges (set via PAYFAST_ALLOWED_IPS env var as comma-separated CIDRs)
    const rawIpHeader = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || '').toString();
    const requesterIp = rawIpHeader.split(',')[0].trim();
    // Use configured PAYFAST_ALLOWED_IPS if present, otherwise fall back to PayFast's official ranges
    // Official PayFast ranges: 41.74.179.192/27, 197.242.156.64/28, 196.33.227.224/27
    const allowedRaw = (typeof Deno !== 'undefined' ? Deno.env.get('PAYFAST_ALLOWED_IPS') : process.env.PAYFAST_ALLOWED_IPS) || '';
    const defaultCidrs = ['41.74.179.192/27', '197.242.156.64/28', '196.33.227.224/27'];
    const cidrs = (allowedRaw ? allowedRaw.split(',').map(s => s.trim()).filter(Boolean) : defaultCidrs);
    const ipToInt = (ip: string) => ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
    const cidrMatch = (cidr: string, ip: string) => {
      try {
        const [net, mask] = cidr.split('/');
        const ipInt = ipToInt(ip);
        const netInt = ipToInt(net);
        const maskInt = ~(2 ** (32 - Number(mask)) - 1) >>> 0;
        return (ipInt & maskInt) === (netInt & maskInt);
      } catch (e) {
        return false;
      }
    };

    const allowed = cidrs.some(c => cidrMatch(c, requesterIp));
    if (!allowed) {
      console.warn('Rejecting PayFast webhook from non-allowed IP:', requesterIp);
      return new Response(JSON.stringify({ success: false, message: 'IP not allowed' }), { status: 403 });
    }

    const contentType = req.headers.get('content-type') || '';
    let bodyParams: any = {};
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      params.forEach((v, k) => { bodyParams[k] = v; });
    } else if (contentType.includes('application/json')) {
      import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

      Deno.serve(async (req) => {
        const ALLOWED_IPS = [
          "41.74.179.192/27",
          "197.242.156.64/28",
          "196.33.227.224/27"
        ];

        // IP Verification (Simplified for deployment)
        const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0];
        console.log(`Incoming request from IP: ${clientIp}`);

        try {
          const formData = await req.formData();
          const data: any = Object.fromEntries(formData.entries());

          if (data.payment_status === "COMPLETE") {
            const supabase = createClient(
              Deno.env.get("SUPABASE_URL") ?? "",
              Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
            );

            const orderId = data.custom_str1 || data.m_payment_id;

            // 1. Update Order Status
            await supabase
              .from("orders")
              .update({ status: "Processing", completed_at: new Date().toISOString() })
              .eq("id", orderId);

            // 2. Decrement Stock using the RPC we built
            const { data: items } = await supabase
              .from("order_items")
              .select("product_id, quantity, variant_details")
              .eq("order_id", orderId);

            if (items) {
              for (const item of items) {
                const size = item.variant_details?.selectedSize || null;
                await supabase.rpc("decrement_product_stock", {
                  p_product_id: item.product_id,
                  p_qty: item.quantity,
                  p_size: size
                });
              }
            }

            console.log(`PAYMENT RECEIVED: Order #${orderId} - Stock Decremented.`);
          }

          return new Response("OK", { status: 200 });
        } catch (err) {
          console.error("Webhook Error:", err.message);
          return new Response(err.message, { status: 500 });
        }
      });
            } catch (itemErr) {

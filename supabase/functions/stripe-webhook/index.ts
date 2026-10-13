import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";
import Stripe from "https://esm.sh/stripe@14.14.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") as string;

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err: any) {
      console.error(`⚠️ Webhook signature verification failed.`, err.message);
      return new Response(err.message, { status: 400 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Obter organizacao_id do client_reference_id (passamos na criação do checkout)
        const organizacaoId = session.client_reference_id;
        
        if (organizacaoId) {
          console.log(`Checkout completado para a org: ${organizacaoId}`);
          await supabaseAdmin
            .from("organizacoes")
            .update({ 
              status_assinatura: "ativa",
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string
            })
            .eq("id", organizacaoId);
        }
        break;
      }
      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const status = subscription.status; // 'active', 'past_due', 'canceled', 'unpaid'
        
        console.log(`Subscription ${subscription.id} status is ${status}.`);
        
        // Mapear status do Stripe para o nosso sistema
        let mappedStatus = "ativa";
        if (status === "canceled" || status === "unpaid") {
          mappedStatus = "inadimplente";
        } else if (status === "past_due") {
          mappedStatus = "atrasada";
        }

        await supabaseAdmin
          .from("organizacoes")
          .update({ status_assinatura: mappedStatus })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error processing webhook:", err);
    return new Response(err.message, { status: 500 });
  }
});

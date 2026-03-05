# --- Compute Instance ---
resource "oci_core_instance" "sobok" {
  compartment_id      = local.compartment_ocid
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  display_name        = "sobok-server"
  shape               = "VM.Standard.A1.Flex"

  shape_config {
    ocpus         = var.instance_ocpus
    memory_in_gbs = var.instance_memory_gb
  }

  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.oracle_linux_9_arm.images[0].id
    boot_volume_size_in_gbs = var.boot_volume_gb
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.sobok_public.id
    assign_public_ip = false
    display_name     = "sobok-primary-vnic"
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data           = base64encode(templatefile("${path.module}/cloud-init.yaml.tftpl", {
      domain        = var.domain
      certbot_email = var.certbot_email
    }))
  }

  lifecycle {
    ignore_changes = [source_details[0].source_id]
  }
}

# --- Get primary VNIC attachment ---
data "oci_core_vnic_attachments" "sobok" {
  compartment_id = local.compartment_ocid
  instance_id    = oci_core_instance.sobok.id
}

data "oci_core_vnic" "sobok" {
  vnic_id = data.oci_core_vnic_attachments.sobok.vnic_attachments[0].vnic_id
}

data "oci_core_private_ips" "sobok" {
  vnic_id = data.oci_core_vnic.sobok.id
}

# --- Reserved Public IP ---
resource "oci_core_public_ip" "sobok" {
  compartment_id = local.compartment_ocid
  display_name   = "sobok-public-ip"
  lifetime       = "RESERVED"
  private_ip_id  = data.oci_core_private_ips.sobok.private_ips[0].id
}

# --- Provision .env file ---
resource "null_resource" "provision_env" {
  depends_on = [oci_core_public_ip.sobok]

  triggers = {
    instance_id = oci_core_instance.sobok.id
  }

  connection {
    type        = "ssh"
    host        = oci_core_public_ip.sobok.ip_address
    user        = "opc"
    private_key = file(var.ssh_private_key_path)
    timeout     = "5m"
  }

  # Upload .env.production to /tmp
  provisioner "file" {
    source      = "${path.module}/../.env.production"
    destination = "/tmp/.env"
  }

  # Move to correct location with proper permissions
  provisioner "remote-exec" {
    inline = [
      "sudo mkdir -p /opt/sobok",
      "sudo mv /tmp/.env /opt/sobok/.env",
      "sudo chmod 600 /opt/sobok/.env",
      "# Wait for cloud-init to create the sobok user (up to 5 min)",
      "for i in $(seq 1 60); do id sobok &>/dev/null && break; sleep 5; done",
      "sudo chown sobok:sobok /opt/sobok/.env",
      "sudo restorecon -Rv /opt/sobok/",
    ]
  }
}

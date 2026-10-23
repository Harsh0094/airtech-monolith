param(
    [Parameter(Mandatory = $true)]
    [string]$PdfPath,

    [Parameter(Mandatory = $true)]
    [string]$Recipient,

    [Parameter(Mandatory = $true)]
    [string]$Subject,

    [Parameter(Mandatory = $true)]
    [string]$HtmlBodyBase64
)

if (-not (Test-Path -LiteralPath $PdfPath -PathType Leaf)) {
    throw "Quotation PDF not found: $PdfPath"
}

if ([System.IO.Path]::GetExtension($PdfPath) -ne ".pdf") {
    throw "The attachment must be a PDF."
}

if ([string]::IsNullOrWhiteSpace($Recipient)) {
    throw "Recipient email is required."
}

$resolvedPdf = (Resolve-Path -LiteralPath $PdfPath).Path

try {
    $htmlBytes = [Convert]::FromBase64String($HtmlBodyBase64)
    $HtmlBody = [System.Text.Encoding]::UTF8.GetString($htmlBytes)
}
catch {
    throw "Could not decode the HTML email body."
}

$Outlook = New-Object -ComObject Outlook.Application
$Mail = $Outlook.CreateItem(0)

$Mail.To = $Recipient
$Mail.Subject = $Subject
$Mail.HTMLBody = $HtmlBody
$null = $Mail.Attachments.Add($resolvedPdf)

$Mail.Display()

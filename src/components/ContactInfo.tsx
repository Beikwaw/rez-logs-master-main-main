import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone } from 'lucide-react';

export function ContactInfo() {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Management</p>
              <p className="text-sm text-muted-foreground">obsadmin@mydomainliving.co.za</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Finance</p>
              <p className="text-sm text-muted-foreground">carmen@swish.co.za</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Security</p>
              <p className="text-sm text-muted-foreground">0682040814</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Tech Team</p>
              <p className="text-sm text-muted-foreground">0787578408</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
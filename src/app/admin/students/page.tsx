{students.map((student) => (
  <Card key={student.id} className="mb-4">
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle>{student.firstName} {student.lastName}</CardTitle>
          <CardDescription>{student.email}</CardDescription>
        </div>
        <Badge variant={student.status === 'active' ? 'success' : 'secondary'}>
          {student.status}
        </Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Room Number</Label>
          <p className="text-lg font-semibold">{student.room_number}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Tenant Code</Label>
          <p className="text-lg font-semibold">{student.tenant_code}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Phone Number</Label>
          <p>{student.phoneNumber}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Place of Study</Label>
          <p>{student.placeOfStudy}</p>
        </div>
      </div>
    </CardContent>
    <CardFooter className="flex justify-end space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleViewDetails(student)}
      >
        View Details
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => handleDeactivate(student.id)}
        disabled={student.status !== 'active'}
      >
        Deactivate
      </Button>
    </CardFooter>
  </Card>
))} 